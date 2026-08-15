'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { AdminLayout } from '../../../components/AdminLayout';
import { Button } from '../../../components/ui/Button';
import { AlertCircle, CheckCircle, Image as ImageIcon, Loader2 } from 'lucide-react';

interface Page {
  id: string;
  slug: string;
  title: string;
  description: string;
  hero_image_url?: string;
}

interface Section {
  id: string;
  section_key: string;
  section_title: string;
  content_text: string;
  image_url?: string;
  section_order: number;
}

export default function TextEditorPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    } else if (isAuthenticated) {
      fetchPages();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${apiUrl}/api/v1/pages`);
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setPages(data.data);
        selectPage(data.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch pages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectPage = async (page: Page) => {
    setSelectedPage(page);
    setEditingSection(null);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/v1/pages/${page.slug}`);
      const data = await response.json();
      setSections(data.sections || []);
    } catch (err) {
      setError('Failed to load page sections');
      console.error(err);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const token = localStorage.getItem('lsn_token');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${apiUrl}/api/v1/upload/image`, {
        method: 'POST',
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const data = await response.json();
      if (editingSection) {
        setEditingSection({ ...editingSection, image_url: data.url });
      }
    } catch (err) {
      setError('Image upload failed');
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection || !selectedPage) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('lsn_token');
      const response = await fetch(
        `${apiUrl}/api/v1/pages/${selectedPage.slug}/sections/${editingSection.section_key}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            section_title: editingSection.section_title,
            content_text: editingSection.content_text,
            image_url: editingSection.image_url
          })
        }
      );

      if (response.ok) {
        setSections(sections.map(s => s.id === editingSection.id ? editingSection : s));
        setEditingSection(null);
        setError(null);
        setSuccess('Section saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to save section');
      }
    } catch (err) {
      setError('Save failed');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || authLoading) {
    return null;
  }

  return (
    <AdminLayout title="Content Editor">
      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex gap-3 animate-fade-in dark:bg-error-950 dark:border-error-900">
          <AlertCircle className="text-error-600 dark:text-error-400 flex-shrink-0" size={20} />
          <p className="text-error-700 dark:text-error-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg flex gap-3 animate-fade-in dark:bg-success-950 dark:border-success-900">
          <CheckCircle className="text-success-600 dark:text-success-400 flex-shrink-0" size={20} />
          <p className="text-success-700 dark:text-success-300">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Page Selection Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="font-bold text-lg text-neutral-900 dark:text-neutral-50">Pages</h2>
              </div>
              <nav className="p-3 space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                {pages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => selectPage(page)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                      selectedPage?.id === page.id
                        ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {page.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedPage ? (
              <div className="space-y-6">
                {/* Page Info Card */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                      {selectedPage.title}
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                      {selectedPage.description}
                    </p>
                    {selectedPage.hero_image_url && (
                      <img
                        src={selectedPage.hero_image_url}
                        alt="Hero"
                        className="w-full max-h-64 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>

                {/* Sections */}
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">
                    Content Sections
                  </h3>
                  {sections.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700">
                      <p className="text-neutral-500 dark:text-neutral-400">No sections yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sections.map(section => (
                        <div
                          key={section.id}
                          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                        >
                          {editingSection?.id === section.id ? (
                            // Edit Mode
                            <div className="p-6 space-y-5">
                              <div>
                                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                                  Section Title
                                </label>
                                <input
                                  type="text"
                                  value={editingSection.section_title || ''}
                                  onChange={(e) =>
                                    setEditingSection({
                                      ...editingSection,
                                      section_title: e.target.value
                                    })
                                  }
                                  placeholder="Section Title"
                                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                                  Content
                                </label>
                                <textarea
                                  value={editingSection.content_text || ''}
                                  onChange={(e) =>
                                    setEditingSection({
                                      ...editingSection,
                                      content_text: e.target.value
                                    })
                                  }
                                  placeholder="Content"
                                  rows={6}
                                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors resize-none"
                                />
                              </div>

                              {/* Image Section */}
                              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-5">
                                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                                  Section Image
                                </label>
                                {editingSection.image_url && (
                                  <img
                                    src={editingSection.image_url}
                                    alt="Section"
                                    className="w-full max-h-48 object-cover rounded-lg mb-3 border border-neutral-200 dark:border-neutral-700"
                                  />
                                )}
                                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                                  <div className="flex flex-col items-center gap-2">
                                    <ImageIcon size={20} className="text-neutral-400" />
                                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                      {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                                    </span>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        handleImageUpload(e.target.files[0]);
                                      }
                                    }}
                                    disabled={uploadingImage}
                                    className="hidden"
                                  />
                                </label>
                              </div>

                              <div className="flex gap-3 pt-5 border-t border-neutral-200 dark:border-neutral-800">
                                <Button
                                  onClick={handleSaveSection}
                                  disabled={saving}
                                  variant="default"
                                  className="flex-1"
                                >
                                  {saving ? (
                                    <>
                                      <Loader2 size={16} className="animate-spin mr-2" />
                                      Saving...
                                    </>
                                  ) : (
                                    'Save Changes'
                                  )}
                                </Button>
                                <Button
                                  onClick={() => setEditingSection(null)}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <div className="p-6">
                              <div className="mb-4">
                                <h4 className="font-bold text-lg text-neutral-900 dark:text-neutral-50 mb-3">
                                  {section.section_title}
                                </h4>
                                <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                                  {section.content_text}
                                </p>
                              </div>
                              {section.image_url && (
                                <img
                                  src={section.image_url}
                                  alt={section.section_title}
                                  className="w-full max-h-48 object-cover rounded-lg mb-4 border border-neutral-200 dark:border-neutral-700"
                                />
                              )}
                              <Button
                                onClick={() => setEditingSection(section)}
                                variant="default"
                              >
                                Edit Section
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <p className="text-neutral-500 dark:text-neutral-400">Select a page to edit</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
