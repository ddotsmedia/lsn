'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import { DataTable } from '../../../components/admin/DataTable';
import type { Column } from '../../../components/admin/DataTable';
import { Button, Modal, FormField, Input, Toast, ConfirmDialog } from '../../../components/admin/shared';

interface AgeGroup { id: number; name: string; min_age: number; max_age: number; created_at: string; }

const EMPTY = { name: '', min_age: 0, max_age: 0 };

export default function AgeGroupsPage() {
  const [data, setData] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await api<AgeGroup[]>('/admin/content/age-groups'); setData(res); }
    catch { setToast({ message: 'Failed to load', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const openEdit = (ag: AgeGroup) => { setEditId(ag.id); setForm({ name: ag.name, min_age: ag.min_age, max_age: ag.max_age }); setShowModal(true); };

  const save = async () => {
    try {
      if (editId) { await api(`/admin/content/age-groups/${editId}`, { method: 'PUT', body: JSON.stringify(form) }); }
      else { await api('/admin/content/age-groups', { method: 'POST', body: JSON.stringify(form) }); }
      setToast({ message: `Age group ${editId ? 'updated' : 'created'}`, type: 'success' });
      setShowModal(false); setEditId(null); setForm(EMPTY); fetchData();
    } catch { setToast({ message: 'Failed to save', type: 'error' }); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await api(`/admin/content/age-groups/${confirmDelete}`, { method: 'DELETE' }); setToast({ message: 'Deleted', type: 'success' }); fetchData(); }
    catch (e) { setToast({ message: (e as Error).message || 'Failed to delete', type: 'error' }); }
    setConfirmDelete(null);
  };

  const columns: Column<AgeGroup>[] = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'min_age', header: 'Min Age (months)' },
    { key: 'max_age', header: 'Max Age (months)' },
    { key: 'actions', header: '', className: 'w-[120px]', render: (r) => (
      <div className="flex gap-1">
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>Edit</Button>
        <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); setConfirmDelete(r.id); }}>×</Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><Button onClick={() => { setEditId(null); setForm(EMPTY); setShowModal(true); }}>+ New Age Group</Button></div>
      <DataTable<AgeGroup> columns={columns} data={data} loading={loading} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Age Group' : 'New Age Group'}>
        <div className="space-y-4">
          <FormField label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 2 - 3 years" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Min Age (months)"><Input type="number" value={form.min_age} onChange={(e) => setForm({ ...form, min_age: Number(e.target.value) })} /></FormField>
            <FormField label="Max Age (months)"><Input type="number" value={form.max_age} onChange={(e) => setForm({ ...form, max_age: Number(e.target.value) })} /></FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save}>{editId ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Age Group" message="Cannot delete if registrations use this group." confirmLabel="Delete" destructive />
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
