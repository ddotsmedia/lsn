'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { PaginatedResponse } from '../../../lib/api';
import { DataTable } from '../../../components/admin/DataTable';
import type { Column } from '../../../components/admin/DataTable';
import { SearchBar, Button, Modal, FormField, Input, Textarea, Toast, ConfirmDialog } from '../../../components/admin/shared';

interface NewsEvent {
  id: string; title: string; slug: string; content: string; image_url: string;
  published_at: string; meta_title: string; meta_description: string; meta_keywords: string;
  created_at: string;
}

const EMPTY_FORM = { title: '', slug: '', content: '', image_url: '', published_at: '', meta_title: '', meta_description: '', meta_keywords: '' };

export default function EventsPage() {
  const [data, setData] = useState<NewsEvent[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api<PaginatedResponse<NewsEvent>>('/admin/content/events', { params: { page, limit: 20, search } });
      setData(res.data);
      setPagination(res.pagination);
    } catch { setToast({ message: 'Failed to load events', type: 'error' }); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const openEdit = (evt: NewsEvent) => {
    setEditId(evt.id);
    setForm({
      title: evt.title, slug: evt.slug, content: evt.content,
      image_url: evt.image_url || '', published_at: evt.published_at?.split('T')[0] || '',
      meta_title: evt.meta_title || '', meta_description: evt.meta_description || '',
      meta_keywords: evt.meta_keywords || '',
    });
    setShowModal(true);
  };

  const save = async () => {
    try {
      const body = { ...form, published_at: form.published_at ? new Date(form.published_at).toISOString() : undefined };
      if (editId) {
        await api(`/admin/content/events/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/admin/content/events', { method: 'POST', body: JSON.stringify(body) });
      }
      setToast({ message: `Event ${editId ? 'updated' : 'created'}`, type: 'success' });
      setShowModal(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      fetchData(pagination.page);
    } catch { setToast({ message: 'Failed to save event', type: 'error' }); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api(`/admin/content/events/${confirmDelete}`, { method: 'DELETE' });
      setToast({ message: 'Event deleted', type: 'success' });
      fetchData(pagination.page);
    } catch { setToast({ message: 'Failed to delete', type: 'error' }); }
    setConfirmDelete(null);
  };

  const setField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const columns: Column<NewsEvent>[] = [
    { key: 'title', header: 'Title', sortable: true, render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'slug', header: 'Slug', render: (r) => <span className="text-xs text-zinc-500">{r.slug}</span> },
    { key: 'published_at', header: 'Published', render: (r) => <span className="text-xs text-zinc-400">{r.published_at ? new Date(r.published_at).toLocaleDateString() : '—'}</span> },
    {
      key: 'actions', header: '', className: 'w-[120px]',
      render: (r) => (
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); setConfirmDelete(r.id); }}>×</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-3">
        <div className="flex-1 max-w-xs"><SearchBar value={search} onChange={setSearch} placeholder="Search events..." /></div>
        <Button onClick={() => { setEditId(null); setForm(EMPTY_FORM); setShowModal(true); }}>+ New Event</Button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={(p) => fetchData(p)} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Event' : 'New Event'} maxWidth="max-w-2xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Title"><Input value={form.title} onChange={(e) => setField('title', e.target.value)} /></FormField>
            <FormField label="Slug"><Input value={form.slug} onChange={(e) => setField('slug', e.target.value)} /></FormField>
          </div>
          <FormField label="Content"><Textarea value={form.content} onChange={(e) => setField('content', e.target.value)} rows={6} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Image URL"><Input value={form.image_url} onChange={(e) => setField('image_url', e.target.value)} placeholder="https://..." /></FormField>
            <FormField label="Published Date"><Input type="date" value={form.published_at} onChange={(e) => setField('published_at', e.target.value)} /></FormField>
          </div>
          <div className="border-t border-zinc-800/50 pt-4 mt-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">SEO Metadata</p>
            <div className="space-y-3">
              <FormField label="Meta Title"><Input value={form.meta_title} onChange={(e) => setField('meta_title', e.target.value)} placeholder="Override page title for search engines" /></FormField>
              <FormField label="Meta Description"><Textarea value={form.meta_description} onChange={(e) => setField('meta_description', e.target.value)} rows={2} placeholder="Description shown in search results" /></FormField>
              <FormField label="Meta Keywords"><Input value={form.meta_keywords} onChange={(e) => setField('meta_keywords', e.target.value)} placeholder="Comma-separated keywords" /></FormField>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save}>{editId ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Event" message="Are you sure?" confirmLabel="Delete" destructive />
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
