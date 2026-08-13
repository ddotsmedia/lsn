'use client';

import { useState } from 'react';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

interface UploadResponse {
  success?: boolean;
  data?: {
    secure_url?: string;
    public_id?: string;
    thumbnail_url?: string;
    duration?: number;
  };
  error?: string;
}

/** Matches the server's limit, so an oversized file is refused before uploading. */
const MAX_BYTES = 100 * 1024 * 1024;
/** Warn above this: still allowed, but slow on a typical connection. */
const WARN_BYTES = 50 * 1024 * 1024;

const ACCEPTED = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi'];

function formatMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/**
 * XHR rather than fetch: a video takes long enough that a progress bar is the
 * difference between "working" and "frozen", and fetch cannot report upload
 * progress.
 */
function uploadWithProgress(
  url: string,
  file: File,
  token: string,
  onProgress: (percent: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    // Large files over a slow link should not be cut off at the default.
    xhr.timeout = 10 * 60 * 1000;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: UploadResponse = {};
      try { body = JSON.parse(xhr.responseText) as UploadResponse; } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) { resolve(body); return; }
      reject(new Error(body.error || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('The upload timed out. Try a smaller file.'));
    xhr.send(form);
  });
}

export default function VideoUploadModal({ isOpen, onClose, onUploadSuccess }: VideoUploadModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Checked against the same list the server enforces. The type is empty for
    // some files, so the extension is the fallback rather than the only test.
    const byType = ACCEPTED.includes(selectedFile.type);
    const byExtension = /\.(mp4|webm|mov|avi)$/i.test(selectedFile.name);
    if (!byType && !byExtension) {
      setError('Please choose an MP4, WebM, MOV or AVI file');
      return;
    }

    // 100 MB, matching the server. The old limit here was 500 MB, so a file
    // between the two was accepted by the form and then rejected on upload.
    if (selectedFile.size > MAX_BYTES) {
      setError(`Video must be 100 MB or smaller — this one is ${formatMB(selectedFile.size)}`);
      return;
    }

    setFile(selectedFile);
    setError('');
    setWarning(
      selectedFile.size > WARN_BYTES
        ? `${formatMB(selectedFile.size)} — this may take a few minutes to upload.`
        : ''
    );

    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  };

  const handleDragDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', {
        value: e.dataTransfer.files,
      });
      handleFileChange({ target: input } as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError('Please fill in title and select a video');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    // Both endpoints are admin-guarded. Neither call sent this header, so every
    // upload came back 401 and was reported as "Upload to Cloudinary failed" —
    // Cloudinary was never reached.
    const token = localStorage.getItem('lsn_token');
    if (!token) {
      setError('Your session has expired. Please sign in again.');
      setUploading(false);
      return;
    }
    const auth = { Authorization: `Bearer ${token}` };

    try {
      const uploadData = await uploadWithProgress(
        `${API}/videos/upload`,
        file,
        token,
        setProgress
      );

      // The endpoint answers { success, data: { ... } }. Reading these off the
      // top level left every field undefined, so the save below would have been
      // rejected for missing a video_url even once the 401 was fixed.
      const { secure_url, public_id, thumbnail_url, duration } = uploadData.data ?? {};
      if (!secure_url || !public_id) {
        throw new Error('The upload succeeded but returned no video URL.');
      }

      const saveRes = await fetch(`${API}/videos/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          video_url: secure_url,
          cloudinary_public_id: public_id,
          thumbnail_url,
          duration_seconds: Math.round(duration || 0),
        }),
      });

      if (!saveRes.ok) {
        const body = (await saveRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || 'Failed to save video details');
      }

      setTitle('');
      setDescription('');
      setFile(null);
      setPreview(null);
      setUploading(false);
      setProgress(0);
      onUploadSuccess();
      onClose();
    } catch (err) {
      // Shows what the server actually said rather than assuming Cloudinary.
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    // bg-black/50, not bg-opacity-50: Tailwind 4 removed the bg-opacity-*
    // utilities, so the overlay was rendering fully opaque black.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Upload Video</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {warning && !error && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {warning}
          </div>
        )}

        {uploading && (
          <div className="mb-4">
            {/* Once the bytes are sent Cloudinary still has to transcode, so
                100% becomes "Processing" rather than sitting at full. */}
            <p className="mb-1 text-sm text-gray-600">
              {progress < 100 ? `Uploading… ${progress}%` : 'Processing the video…'}
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-600 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Video Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Classroom Activities"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              disabled={uploading}
            />
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDragDrop}
            className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center"
          >
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="space-y-2">
                <div className="text-3xl">🎬</div>
                <div className="text-sm font-medium text-gray-700">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </div>
                <div className="text-xs text-gray-500">
                  MP4, WebM, MOV (max 500MB)
                </div>
              </div>
            </label>
          </div>

          {preview && (
            <div className="rounded-lg bg-black overflow-hidden">
              <video
                src={preview}
                controls
                className="w-full h-48 object-contain"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {uploading ? (progress < 100 ? `Uploading ${progress}%` : 'Processing…') : 'Upload Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
