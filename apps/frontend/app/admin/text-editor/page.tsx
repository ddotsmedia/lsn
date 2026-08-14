'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageContent } from '../../../hooks/usePageContent';
import { useAuth } from '../../../lib/auth-context';

export default function TextEditorPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();

  const pages = ['home', 'about', 'facilities', 'contact'];
  const [selectedPage, setSelectedPage] = useState('home');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const { content, loading, error, updateContent } = usePageContent(selectedPage);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const handleSave = async (sectionKey: string) => {
    setSaveStatus('Saving...');
    const success = await updateContent(sectionKey, editValue);
    if (success) {
      setSaveStatus('✓ Saved!');
      setEditingKey(null);
      setTimeout(() => setSaveStatus(''), 2000);
    } else {
      setSaveStatus('✗ Failed to save');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Content Editor</h1>
          <button
            onClick={() => {
              logout();
              router.push('/admin/login');
            }}
            className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors font-medium"
          >
            Logout
          </button>
        </div>

        {/* Page Tabs */}
        <div className="flex gap-2 mb-6 border-b overflow-x-auto">
          {pages.map(page => (
            <button
              key={page}
              onClick={() => setSelectedPage(page)}
              className={`px-3 sm:px-4 py-2 font-medium whitespace-nowrap transition-colors ${
                selectedPage === page
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Content List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-r-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          </div>
        ) : Object.keys(content).length === 0 ? (
          <div className="p-6 bg-white rounded-lg shadow text-center text-gray-500">
            No content sections found for this page.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(content).map(([key, value]) => (
              <div key={key} className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                  {key.replace(/_/g, ' ').toUpperCase()}
                </h3>

                {editingKey === key ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter content..."
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleSave(key)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                      {saveStatus && (
                        <span className={`text-sm font-medium py-2 ${saveStatus.includes('Saved') ? 'text-green-600' : 'text-red-600'}`}>
                          {saveStatus}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 mb-3 text-sm leading-relaxed break-words">{value || '(Empty)'}</p>
                    <button
                      onClick={() => {
                        setEditingKey(key);
                        setEditValue(value);
                        setSaveStatus('');
                      }}
                      className="px-3 py-1.5 bg-gray-200 text-gray-900 rounded text-sm hover:bg-gray-300 transition-colors font-medium"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
