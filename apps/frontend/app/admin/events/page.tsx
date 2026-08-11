'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { PaginatedResponse } from '../../../lib/api';
import { DataTable } from '../../../components/admin/DataTable';
import type { Column } from '../../../components/admin/DataTable';
import {
  SearchBar, Button, Modal, FormField, Input, Textarea, Select, Toast, ConfirmDialog,
} from '../../../components/admin/shared';

/** Mirrors the news_events columns as they exist in the database. */
interface NewsEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  end_time: string | null;
  location: string | null;
  image_url: string | null;
  event_type: string;
  age_groups: string | null;
  is_published: boolean;
  created_at: string;
}

/** The same set the public events page styles a badge for. */
const EVENT_TYPES = [
  'General', 'Celebration', 'Learning', 'Workshop',
  'Sports', 'Performance', 'Exhibition', 'Meeting',
] as const;

const TYPE_OPTIONS = EVENT_TYPES.map((t) => ({ value: t, label: t }));
const STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

interface FormState {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  end_time: string;
  location: string;
  image_url: string;
  event_type: string;
  age_groups: string;
  is_published: boolean;
}

const EMPTY_FORM: FormState = {
  title: '', description: '', event_date: '', event_time: '', end_time: '',
  location: '', image_url: '', event_type: 'General', age_groups: '', is_published: true,
};

type Errors = Partial<Record<keyof FormState, string>>;

/**
 * Mirrors the server's rules so mistakes are caught before a round trip. The
 * server still validates — this only saves the user a failed request.
 * Deliberately no future-date rule: this table also holds past events, which
 * are what the public site lists under "News".
 */
function validate(form: FormState): Errors {
  const errors: Errors = {};

  if (form.title.trim().length < 3) errors.title = 'Title must be at least 3 characters';
  else if (form.title.trim().length > 255) errors.title = 'Title must be 255 characters or fewer';

  if (form.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  if (!form.event_date) errors.event_date = 'Date is required';

  if (form.event_time && form.end_time && form.end_time <= form.event_time) {
    errors.end_time = 'End time must be after the start time';
  }

  if (form.image_url.trim()) {
    try {
      new URL(form.image_url.trim());
    } catch {
      errors.image_url = 'Must be a valid URL, e.g. https://example.com/photo.jpg';
    }
  }

  return errors;
}

export default function EventsPage() {
  const [data, setData] = useState<NewsEvent[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api<PaginatedResponse<NewsEvent>>('/admin/content/events', {
        params: { page, limit: 20, search },
      });
      setData(res.data);
      setPagination(res.pagination);
    } catch { setToast({ message: 'Failed to load events', type: 'error' }); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (evt: NewsEvent) => {
    setEditId(evt.id);
    setForm({
      title: evt.title,
      description: evt.description || '',
      // A date column arrives as YYYY-MM-DD, but slice defensively in case a
      // driver hands back a full timestamp — <input type="date"> needs the
      // bare date or it renders empty.
      event_date: evt.event_date?.slice(0, 10) || '',
      event_time: evt.event_time?.slice(0, 5) || '',
      end_time: evt.end_time?.slice(0, 5) || '',
      location: evt.location || '',
      image_url: evt.image_url || '',
      event_type: evt.event_type || 'General',
      age_groups: evt.age_groups || '',
      is_published: evt.is_published !== false,
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

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
        title: form.title.trim(),
        description: form.description.trim(),
        event_date: form.event_date,
        event_time: form.event_time || null,
        end_time: form.end_time || null,
        location: form.location.trim() || null,
        image_url: form.image_url.trim() || null,
        event_type: form.event_type,
        age_groups: form.age_groups.trim() || null,
        is_published: form.is_published,
      };

      if (editId) {
        await api(`/admin/content/events/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/admin/content/events', { method: 'POST', body: JSON.stringify(body) });
      }

      setToast({ message: editId ? 'News item updated' : 'News item created', type: 'success' });
      setShowModal(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      // Back to page 1 after a create: the list is date-ordered, so a new item
      // will not necessarily be on whichever page is open.
      fetchData(editId ? pagination.page : 1);
    } catch (err) {
      // Surfaces the server's own message so a rejected field is actionable.
      const message = err instanceof Error ? err.message : 'Failed to save';
      setToast({ message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api(`/admin/content/events/${confirmDelete}`, { method: 'DELETE' });
      setToast({ message: 'News item deleted', type: 'success' });
      fetchData(pagination.page);
    } catch { setToast({ message: 'Failed to delete', type: 'error' }); }
    setConfirmDelete(null);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Clear the field's error as soon as it is touched; it is re-checked on save.
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const columns: Column<NewsEvent>[] = [
    {
      key: 'title', header: 'Title', sortable: true,
      render: (r) => <span className="font-medium">{r.title}</span>,
    },
    {
      key: 'event_date', header: 'Date',
      render: (r) => (
        <span className="text-xs text-zinc-400">
          {r.event_date ? new Date(`${r.event_date.slice(0, 10)}T00:00:00`).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'event_type', header: 'Type',
      render: (r) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
          {r.event_type || 'General'}
        </span>
      ),
    },
    {
      key: 'is_published', header: 'Status',
      render: (r) => (
        <span className={`text-xs px-2 py-0.5 rounded-full border ${
          r.is_published
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
        }`}>
          {r.is_published ? 'Published' : 'Draft'}
        </span>
      ),
    },
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <SearchBar value={search} onChange={setSearch} placeholder="Search news & events..." />
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto shrink-0">+ Add News</Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchData(p)}
        emptyMessage="No news or events yet. Use “+ Add News” to create the first one."
      />

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editId ? 'Edit News Item' : 'Add News'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <FormField label="Title *" error={errors.title}>
            <Input
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="End of Year Celebration"
              maxLength={255}
            />
          </FormField>

          <FormField label="Description *" error={errors.description}>
            <Textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={5}
              placeholder="What happened, or what is planned?"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Date *" error={errors.event_date}>
              <Input
                type="date"
                value={form.event_date}
                onChange={(e) => setField('event_date', e.target.value)}
              />
            </FormField>
            <FormField label="Start Time" error={errors.event_time}>
              <Input
                type="time"
                value={form.event_time}
                onChange={(e) => setField('event_time', e.target.value)}
              />
            </FormField>
            <FormField label="End Time" error={errors.end_time}>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => setField('end_time', e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Category">
              <Select
                value={form.event_type}
                onChange={(e) => setField('event_type', e.target.value)}
                options={TYPE_OPTIONS}
              />
            </FormField>
            <FormField label="Status">
              <Select
                value={form.is_published ? 'published' : 'draft'}
                onChange={(e) => setField('is_published', e.target.value === 'published')}
                options={STATUS_OPTIONS}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Location">
              <Input
                value={form.location}
                onChange={(e) => setField('location', e.target.value)}
                placeholder="Main Hall"
                maxLength={255}
              />
            </FormField>
            <FormField label="Age Groups">
              <Input
                value={form.age_groups}
                onChange={(e) => setField('age_groups', e.target.value)}
                placeholder="All ages"
                maxLength={255}
              />
            </FormField>
          </div>

          <FormField label="Image URL" error={errors.image_url}>
            <Input
              value={form.image_url}
              onChange={(e) => setField('image_url', e.target.value)}
              placeholder="https://..."
            />
          </FormField>
          {form.image_url.trim() && !errors.image_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={form.image_url.trim()}
              alt=""
              className="h-28 w-full rounded-lg border border-zinc-800 object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}

          <div className="flex justify-end gap-2 border-t border-zinc-800/50 pt-4">
            <Button variant="secondary" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create News'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete News Item"
        message="This moves the item to the recycle bin, where it can be restored."
        confirmLabel="Delete"
        destructive
      />
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
