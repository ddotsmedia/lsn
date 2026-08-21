'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { clearPageHeadingCache } from '../../../lib/pageHeadings';
import { Button, FormField, Textarea, Toast } from '../../../components/admin/shared';

interface PageHeading {
  page_slug: string;
  label: string;
  heading_text: string;
  updated_at: string | null;
}

const MAX_LENGTH = 200;

export default function PageHeadingsPage() {
  const [headings, setHeadings] = useState<PageHeading[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api<PageHeading[]>('/admin/page-headings');
      setHeadings(rows);
      setDrafts(Object.fromEntries(rows.map((r) => [r.page_slug, r.heading_text])));
    } catch {
      setToast({ message: 'Failed to load page headings', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const save = async (slug: string): Promise<void> => {
    const text = (drafts[slug] ?? '').trim();
    if (!text) {
      setToast({ message: 'Heading cannot be empty', type: 'error' });
      return;
    }

    setSavingSlug(slug);
    try {
      const saved = await api<PageHeading>(`/admin/page-headings/${slug}`, {
        method: 'PUT',
        body: JSON.stringify({ heading_text: text }),
      });
      setHeadings((prev) =>
        prev.map((h) =>
          h.page_slug === slug
            ? { ...h, heading_text: saved.heading_text, updated_at: saved.updated_at }
            : h
        )
      );
      setDrafts((prev) => ({ ...prev, [slug]: saved.heading_text }));
      // The public hook caches per tab; drop the stale entry so a preview in
      // this browser shows the new heading without a hard reload.
      clearPageHeadingCache(slug);
      setToast({ message: 'Heading saved', type: 'success' });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to save heading',
        type: 'error',
      });
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Page Headings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The main title (H1) shown at the top of each public page. Line breaks are kept, so the
          home heading can stay on two lines.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : headings.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
          No pages returned.
        </div>
      ) : (
        <div className="space-y-4">
          {headings.map((heading) => {
            const draft = drafts[heading.page_slug] ?? '';
            const dirty = draft.trim() !== heading.heading_text.trim();
            const tooLong = draft.length > MAX_LENGTH;

            return (
              <div
                key={heading.page_slug}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 md:p-5"
              >
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{heading.label}</p>
                    <p className="text-[11px] text-zinc-600">/{heading.page_slug}</p>
                  </div>
                  {heading.updated_at && (
                    <p className="text-[11px] text-zinc-600">
                      Updated {new Date(heading.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <FormField label="Heading">
                  <Textarea
                    rows={2}
                    value={draft}
                    aria-label={`Heading for ${heading.label}`}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [heading.page_slug]: e.target.value }))
                    }
                  />
                </FormField>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className={`text-[11px] ${tooLong ? 'text-red-400' : 'text-zinc-600'}`}>
                    {draft.length} / {MAX_LENGTH}
                  </p>
                  <Button
                    onClick={() => void save(heading.page_slug)}
                    disabled={!dirty || tooLong || savingSlug === heading.page_slug}
                  >
                    {savingSlug === heading.page_slug ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
