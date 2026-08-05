'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { PaginatedResponse } from '../../../lib/api';
import { DataTable } from '../../../components/admin/DataTable';
import type { Column } from '../../../components/admin/DataTable';
import { Button, Modal, FormField, Input, Textarea, Toast, ConfirmDialog } from '../../../components/admin/shared';

interface Facility {
  id: string; name: string; description: string; image_url: string; location: string;
  meta_title: string; meta_description: string; sort_order: number; created_at: string;
}

const EMPTY = { name: '', description: '', image_url: '', location: '', meta_title: '', meta_description: '' };

export default function FacilitiesPage() {
  const [data, setData] = useState<Facility[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api<PaginatedResponse<Facility>>('/admin/content/facilities', { params: { page, limit: 20 } });
      setData(res.data);
      setPagination(res.pagination);
    } catch { setToast({ message: 'Failed to load facilities', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const openEdit = (f: Facility) => {
    setEditId(f.id);
    setForm({ name: f.name, description: f.description, image_url: f.image_url || '', location: f.location, meta_title: f.meta_title || '', meta_description: f.meta_description || '' });
    setShowModal(true);
  };

  const save = async () => {
    try {
      if (editId) {
        await api(`/admin/content/facilities/${editId}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await api('/admin/content/facilities', { method: 'POST', body: JSON.stringify(form) });
      }
      setToast({ message: `Facility ${editId ? 'updated' : 'created'}`, type: 'success' });
      setShowModal(false); setEditId(null); setForm(EMPTY);
      fetchData(pagination.page);
    } catch { setToast({ message: 'Failed to save', type: 'error' }); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await api(`/admin/content/facilities/${confirmDelete}`, { method: 'DELETE' }); setToast({ message: 'Deleted', type: 'success' }); fetchData(pagination.page); }
    catch { setToast({ message: 'Failed to delete', type: 'error' }); }
    setConfirmDelete(null);
  };

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const columns: Column<Facility>[] = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'location', header: 'Location' },
    { key: 'created_at', header: 'Created', render: (r) => <span className="text-xs text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</span> },
    { key: 'actions', header: '', className: 'w-[120px]', render: (r) => (
      <div className="flex gap-1">
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>Edit</Button>
        <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); setConfirmDelete(r.id); }}>×</Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><Button onClick={() => { setEditId(null); setForm(EMPTY); setShowModal(true); }}>+ New Facility</Button></div>
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={(p) => fetchData(p)} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Facility' : 'New Facility'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <FormField label="Name"><Input value={form.name} onChange={(e) => setField('name', e.target.value)} /></FormField>
          <FormField label="Location"><Input value={form.location} onChange={(e) => setField('location', e.target.value)} /></FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={4} /></FormField>
          <FormField label="Image URL"><Input value={form.image_url} onChange={(e) => setField('image_url', e.target.value)} /></FormField>
          <div className="border-t border-zinc-800/50 pt-4"><p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">SEO</p>
            <FormField label="Meta Title"><Input value={form.meta_title} onChange={(e) => setField('meta_title', e.target.value)} /></FormField>
            <FormField label="Meta Description"><Textarea value={form.meta_description} onChange={(e) => setField('meta_description', e.target.value)} rows={2} /></FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save}>{editId ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Facility" message="Are you sure?" confirmLabel="Delete" destructive />
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
