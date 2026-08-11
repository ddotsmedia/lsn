'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Modal from '@/components/Modal';
import VideoUploadModal from '@/components/VideoUploadModal';

interface GalleryImage {
  id: string;
  title: string;
  alt_text: string | null;
  description: string | null;
  image_url: string;
  category_id: string | null;
  category_name: string | null;
}

interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  image_count: number;
}

const API = process.env.NEXT_PUBLIC_API_URL;

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [active, setActive] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/gallery/categories`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: GalleryCategory[]) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch(`${API}/auth/me`);
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin || false);
        }
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${API}/videos/list`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data.data || []);
      }
    } catch {
      setVideos([]);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      const res = await fetch(`${API}/videos/${videoId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchVideos();
      }
    } catch (err) {
      console.error('Error deleting video:', err);
    }
  };

  const load = useCallback(async (slug: string) => {
    setLoading(true);
    setError(false);
    try {
      const url = slug === 'all' ? `${API}/gallery` : `${API}/gallery?category=${slug}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data: GalleryImage[] = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(active);
  }, [active, load]);

  const current = openIndex !== null ? images[openIndex] ?? null : null;

  const step = (by: number) => {
    setOpenIndex((idx) => {
      if (idx === null) return null;
      const next = idx + by;
      return next >= 0 && next < images.length ? next : idx;
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'Escape') setOpenIndex(null);
    };
    if (openIndex !== null) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openIndex, images.length]);

  const filters = [
    { slug: 'all', name: 'All photos' },
    ...categories,
    { slug: 'videos', name: 'Videos', image_count: videos.length }
  ];

  return (
    <>
      <Header />
      <main className="bg-white">
        <section
          aria-labelledby="gallery-hero"
          className="bg-gradient-to-br from-blue-800 to-blue-500 px-4 py-12 text-center md:py-16"
        >
          <h1 id="gallery-hero" className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Gallery
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-blue-50 md:text-lg">
            A look inside our rooms, our garden and our busiest days.
          </p>
        </section>
        <section aria-labelledby="gallery-heading" className="py-10 md:py-16">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 id="gallery-heading" className="sr-only">
              Photo gallery
            </h2>

            <ul className="mb-8 flex flex-wrap gap-2">
              {filters.map(({ slug, name }) => (
                <li key={slug}>
                  <button
                    onClick={() => {
                      setActive(slug);
                      setOpenIndex(null);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active === slug
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600'
                    }`}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>

            {active !== 'videos' && (
              <>
                {loading && (
                  <div className="py-12 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-red-800">
                    Failed to load gallery. Please try again.
                  </div>
                )}

                {!loading && !error && images.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    No images found in this category.
                  </div>
                )}

                {!loading && images.length > 0 && (
                  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {images.map((image, idx) => (
                      <li key={image.id}>
                        <button
                          onClick={() => setOpenIndex(idx)}
                          className="group relative block w-full overflow-hidden rounded-lg bg-gray-100"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.image_url}
                            alt={image.alt_text || image.title}
                            className="aspect-square w-full object-cover transition group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                            <span className="text-2xl text-white opacity-0 transition group-hover:opacity-100">
                              👁
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {active === 'videos' && (
              <section className="mt-8">
                {isAdmin && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="mb-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    + Upload Video
                  </button>
                )}

                {videos.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No videos yet</p>
                    {isAdmin && (
                      <p className="text-sm text-gray-500 mt-2">
                        Click "Upload Video" to add promotional videos
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                      <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="relative bg-black h-48">
                          <video
                            src={video.video_url}
                            poster={video.thumbnail_url}
                            controls
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900">{video.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {video.description}
                          </p>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteVideo(video.id)}
                              className="mt-4 w-full px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </section>
      </main>
      <Footer />

      <Modal
        isOpen={current !== null && active !== 'videos'}
        onClose={() => setOpenIndex(null)}
        title={current?.title ?? ''}
        size="lg"
      >
        {current && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.image_url}
              alt={current.alt_text || current.title}
              className="max-h-[60vh] w-full rounded-lg object-contain"
            />
            {current.category_name && (
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-red-600">
                {current.category_name}
              </p>
            )}
            {current.description && (
              <p className="mt-2 text-base leading-relaxed text-gray-700">
                {current.description}
              </p>
            )}
            {images.length > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="min-h-11 rounded-lg px-3 text-sm font-semibold text-blue-800 hover:bg-blue-50"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-600">
                  {(openIndex ?? 0) + 1} of {images.length}
                </span>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="min-h-11 rounded-lg px-3 text-sm font-semibold text-blue-800 hover:bg-blue-50"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <VideoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={() => {
          fetchVideos();
        }}
      />
    </>
  );
}
