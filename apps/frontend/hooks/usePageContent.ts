import { useState, useEffect } from 'react';

interface ContentItem {
  id: string;
  section_key: string;
  content_value: string;
  content_type: string;
  display_order: number;
  is_editable: boolean;
  updated_at: string;
}

export function usePageContent(pageSlug: string) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        setError(null);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011/api/v1';
        const response = await fetch(`${apiUrl}/pages/${pageSlug}/content`);

        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`);
        }

        const data = await response.json();

        const contentMap: Record<string, string> = {};
        data.data?.forEach((item: ContentItem) => {
          contentMap[item.section_key] = item.content_value;
        });

        setContent(contentMap);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch content';
        console.error('Failed to fetch content:', message);
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [pageSlug]);

  const getContentValue = (key: string, fallback: string = ''): string => {
    return content[key] || fallback;
  };

  const updateContent = async (sectionKey: string, value: string): Promise<boolean> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011/api/v1';
      const response = await fetch(`${apiUrl}/pages/${pageSlug}/content/${sectionKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_value: value })
      });

      if (!response.ok) {
        throw new Error(`Failed to update content: ${response.statusText}`);
      }

      setContent(prev => ({ ...prev, [sectionKey]: value }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update content';
      console.error('Failed to update content:', message);
      setError(message);
      return false;
    }
  };

  return {
    content,
    loading,
    error,
    getContentValue,
    updateContent
  };
}
