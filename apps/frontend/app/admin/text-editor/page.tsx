'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';

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
  const { isAuthenticated, loading: authLoading, logout } = useAuth();

  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  if (!isAuthenticated || authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading pages...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar - Page List */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow p-4 sticky top-6">
                <h2 className="font-bold text-lg text-gray-900 mb-4">Pages</h2>
                <div className="space-y-2">
                  {pages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => selectPage(page)}
                      className={`w-full text-left px-4 py-3 rounded transition-colors text-sm font-medium ${
                        selectedPage?.id === page.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {page.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              {selectedPage ? (
                <div className="space-y-6">
                  {/* Page Info */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPage.title}</h2>
                    <p className="text-gray-600 mb-4">{selectedPage.description}</p>
                    {selectedPage.hero_image_url && (
                      <img
                        src={selectedPage.hero_image_url}
                        alt="Hero"
                        className="w-full max-h-64 object-cover rounded"
                      />
                    )}
                  </div>

                  {/* Sections */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">Content Sections</h3>
                    {sections.length === 0 ? (
                      <p className="text-gray-500">No sections yet</p>
                    ) : (
                      sections.map(section => (
                        <div key={section.id} className="bg-white rounded-lg shadow p-6">
                          {editingSection?.id === section.id ? (
                            // Edit Mode
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                  rows={4}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              {/* Image Section */}
                              <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Image
                                </label>
                                {editingSection.image_url && (
                                  <img
                                    src={editingSection.image_url}
                                    alt="Section"
                                    className="w-full max-h-48 object-cover rounded mb-2"
                                  />
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleImageUpload(e.target.files[0]);
                                    }
                                  }}
                                  disabled={uploadingImage}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                                {uploadingImage && (
                                  <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                                )}
                              </div>

                              <div className="flex gap-2 pt-4 border-t">
                                <button
                                  onClick={handleSaveSection}
                                  disabled={saving}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                                >
                                  {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                  onClick={() => setEditingSection(null)}
                                  className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <div>
                              <h4 className="font-bold text-lg text-gray-900 mb-2">
                                {section.section_title}
                              </h4>
                              <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                                {section.content_text}
                              </p>
                              {section.image_url && (
                                <img
                                  src={section.image_url}
                                  alt={section.section_title}
                                  className="w-full max-h-48 object-cover rounded mb-4"
                                />
                              )}
                              <button
                                onClick={() => setEditingSection(section)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                Edit Section
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500">Select a page to edit</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
