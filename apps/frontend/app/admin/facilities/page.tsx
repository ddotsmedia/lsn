'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { PaginatedResponse } from '../../../lib/api';
import { DataTable } from '../../../components/admin/DataTable';
import type { Column } from '../../../components/admin/DataTable';
import { Button, Modal, FormField, Input, Textarea, Toast, ConfirmDialog } from '../../../components/admin/shared';

interface Facility {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  location: string | null;
  icon: string | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number;
  created_at: string;
}

interface FormState {
  name: string;
  description: string;
  image_url: string;
  location: string;
  icon: string;
  meta_title: string;
  meta_description: string;
}

const EMPTY: FormState = {
  name: '', description: '', image_url: '', location: '', icon: '', meta_title: '', meta_description: '',
};

type Errors = Partial<Record<keyof FormState, string>>;

/** Mirrors the server's rules so a mistake costs no round trip. */
function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  else if (form.name.trim().length > 255) errors.name = 'Name must be 255 characters or fewer';
  if (!form.description.trim()) errors.description = 'Description is required';
  if (form.image_url.trim()) {
    try { new URL(form.image_url.trim()); }
    catch { errors.image_url = 'Must be a valid URL, e.g. https://example.com/photo.jpg'; }
  }
  return errors;
}

export default function FacilitiesPage() {
  const [data, setData] = useState<Facility[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  /** Set when the list could not be loaded, so the page can offer a retry. */
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Facility | null>(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api<PaginatedResponse<Facility>>('/admin/facilities', { params: { page, limit: 20 } });
      setData(res.data);
      setPagination(res.pagination);
    } catch (err) {
      // Surfaces the server's own message rather than a blanket "failed",
      // which is what made the original error impossible to act on.
      setLoadError(err instanceof Error ? err.message : 'Failed to load facilities');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setErrors({}); setShowModal(true); };

  const openEdit = (f: Facility) => {
    setEditId(f.id);
    setForm({
      name: f.name,
      description: f.description ?? '',
      image_url: f.image_url ?? '',
      location: f.location ?? '',
      icon: f.icon ?? '',
      meta_title: f.meta_title ?? '',
      meta_description: f.meta_description ?? '',
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => { if (!saving) { setShowModal(false); setEditId(null); setErrors({}); } };

  const save = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setToast({ message: 'Please fix the highlighted fields', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        image_url: form.image_url.trim() || null,
        location: form.location.trim() || null,
        icon: form.icon.trim() || null,
        meta_title: form.meta_title.trim() || null,
        meta_description: form.meta_description.trim() || null,
      };
      if (editId) {
        await api(`/admin/facilities/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/admin/facilities', { method: 'POST', body: JSON.stringify(body) });
      }
      setToast({ message: `Facility ${editId ? 'updated' : 'created'}`, type: 'success' });
      setShowModal(false); setEditId(null); setForm(EMPTY);
      fetchData(editId ? pagination.page : 1);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to save', type: 'error' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setConfirmDelete(null);
    try {
      await api(`/admin/facilities/${target.id}`, { method: 'DELETE' });
      setToast({ message: `${target.name} deleted`, type: 'success' });
      fetchData(pagination.page);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to delete', type: 'error' });
    }
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const columns: Column<Facility>[] = [
    {
      key: 'name', header: 'Name',
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.icon && <span aria-hidden="true">{r.icon}</span>}
          <span className="font-medium">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'location', header: 'Location',
      render: (r) => <span className="text-xs text-zinc-400">{r.location || '—'}</span>,
    },
    {
      key: 'description', header: 'Description',
      render: (r) => (
        <span className="block max-w-md truncate text-xs text-zinc-500" title={r.description}>
          {r.description || '—'}
        </span>
      ),
    },
    {
      key: 'actions', header: '', className: 'w-[150px]',
      render: (r) => (
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); setConfirmDelete(r); }}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {loading ? 'Loading…' : `${pagination.total} facilit${pagination.total === 1 ? 'y' : 'ies'}`}
        </p>
        <Button onClick={openCreate}>+ New Facility</Button>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-sm font-medium text-red-300">Could not load facilities</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-red-400/80">{loadError}</p>
          <Button variant="secondary" onClick={() => fetchData(pagination.page)} className="mt-4">
            Try again
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p)}
          emptyMessage="No facilities yet. Use “+ New Facility” to add the first one."
        />
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editId ? 'Edit Facility' : 'New Facility'}
        maxWidth="max-w-xl"
      >
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_100px]">
            <FormField label="Name *" error={errors.name}>
              <Input value={form.name} onChange={(e) => setField('name', e.target.value)} maxLength={255} />
            </FormField>
            <FormField label="Icon">
              <Input
                value={form.icon}
                onChange={(e) => setField('icon', e.target.value)}
                placeholder="🎨"
                maxLength={100}
              />
            </FormField>
          </div>

          <FormField label="Location">
            <Input
              value={form.location}
              onChange={(e) => setField('location', e.target.value)}
              placeholder="Ground floor, east wing"
              maxLength={255}
            />
          </FormField>

          <FormField label="Description *" error={errors.description}>
            <Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={4} />
          </FormField>

          <FormField label="Image URL" error={errors.image_url}>
            <Input
              value={form.image_url}
              onChange={(e) => setField('image_url', e.target.value)}
              placeholder="https://..."
            />
          </FormField>

          <div className="border-t border-zinc-800/50 pt-4">
            <p className="mb-3 text-xs uppercase tracking-wider text-zinc-500">SEO</p>
            <div className="space-y-3">
              <FormField label="Meta Title">
                <Input value={form.meta_title} onChange={(e) => setField('meta_title', e.target.value)} maxLength={255} />
              </FormField>
              <FormField label="Meta Description">
                <Textarea value={form.meta_description} onChange={(e) => setField('meta_description', e.target.value)} rows={2} />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-800/50 pt-4">
            <Button variant="secondary" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete facility"
        message={`Delete ${confirmDelete?.name ?? 'this facility'}? It moves to the recycle bin and can be restored.`}
        confirmLabel="Delete"
        destructive
      />
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
