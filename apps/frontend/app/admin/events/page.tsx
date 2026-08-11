'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { PaginatedResponse } from '../../../lib/api';
import { DataTable } from '../../../components/admin/DataTable';
import type { Column } from '../../../components/admin/DataTable';
import {
  SearchBar, Button, Modal, FormField, Input, Textarea, Select, Toast, ConfirmDialog,
} from '../../../components/admin/shared';

/* ------------------------------------------------------------------ types */

/** An announcement: a date and a body, nothing else. Table: news. */
interface NewsItem {
  id: string;
  title: string;
  description: string;
  published_date: string | null;
  is_published: boolean;
  created_at: string;
}

/** A dated happening with a time, a place and an audience. Table: news_events. */
interface EventItem {
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

type Tab = 'news' | 'events';

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

/* ------------------------------------------------------------------ forms */

interface NewsForm {
  title: string;
  description: string;
  published_date: string;
  is_published: boolean;
}

interface EventForm {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  end_time: string;
  location: string;
  event_type: string;
  age_groups: string;
  image_url: string;
  is_published: boolean;
}

const EMPTY_NEWS: NewsForm = {
  title: '', description: '', published_date: '', is_published: true,
};

const EMPTY_EVENT: EventForm = {
  title: '', description: '', event_date: '', event_time: '', end_time: '',
  location: '', event_type: 'General', age_groups: '', image_url: '', is_published: true,
};

type Errors = Record<string, string | undefined>;

/** Shared by both forms; the server enforces the same minimums. */
function validateCommon(title: string, description: string, date: string, dateKey: string): Errors {
  const errors: Errors = {};
  if (title.trim().length < 3) errors.title = 'Title must be at least 3 characters';
  else if (title.trim().length > 255) errors.title = 'Title must be 255 characters or fewer';
  if (description.trim().length < 10) errors.description = 'Description must be at least 10 characters';
  if (!date) errors[dateKey] = 'Date is required';
  return errors;
}

function validateNews(form: NewsForm): Errors {
  return validateCommon(form.title, form.description, form.published_date, 'published_date');
}

function validateEvent(form: EventForm): Errors {
  const errors = validateCommon(form.title, form.description, form.event_date, 'event_date');

  if (form.event_time && form.end_time && form.end_time <= form.event_time) {
    errors.end_time = 'End time must be after the start time';
  }
  if (form.image_url.trim()) {
    try { new URL(form.image_url.trim()); }
    catch { errors.image_url = 'Must be a valid URL, e.g. https://example.com/photo.jpg'; }
  }
  return errors;
}

/** A date column can arrive as YYYY-MM-DD or as a full timestamp. */
const toDateInput = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');
const toTimeInput = (v: string | null | undefined) => (v ? v.slice(0, 5) : '');

const formatDate = (v: string | null) =>
  v ? new Date(`${v.slice(0, 10)}T00:00:00`).toLocaleDateString() : '—';

/* ------------------------------------------------------------- components */

function StatusPill({ published }: { published: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${
      published
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
    }`}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onEdit(); }}>Edit</Button>
      <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(); }}>Delete</Button>
    </div>
  );
}

/* ------------------------------------------------------------------- page */

export default function NewsAndEventsPage() {
  const [tab, setTab] = useState<Tab>('news');
  const [search, setSearch] = useState('');

  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [newsPage, setNewsPage] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [eventsPage, setEventsPage] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState<NewsForm>(EMPTY_NEWS);
  const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT);
  const [errors, setErrors] = useState<Errors>({});

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; tab: Tab } | null>(null);

  const isNews = tab === 'news';

  /* ---------------------------------------------------------- data loading */

  const fetchData = useCallback(async (which: Tab, page = 1) => {
    setLoading(true);
    setLoadError(null);
    try {
      if (which === 'news') {
        const res = await api<PaginatedResponse<NewsItem>>('/admin/news', {
          params: { page, limit: 20, search },
        });
        setNews(res.data);
        setNewsPage(res.pagination);
      } else {
        const res = await api<PaginatedResponse<EventItem>>('/admin/events', {
          params: { page, limit: 20, search },
        });
        setEvents(res.data);
        setEventsPage(res.pagination);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load';
      setLoadError(message);
      setToast({ message: `Failed to load ${which}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Refetches on tab change and on search, so the query applies to whichever
  // list is showing.
  useEffect(() => { fetchData(tab, 1); }, [fetchData, tab]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  /* ---------------------------------------------------------------- modals */

  const openCreate = () => {
    setEditId(null);
    setNewsForm(EMPTY_NEWS);
    setEventForm(EMPTY_EVENT);
    setErrors({});
    setShowModal(true);
  };

  const openEditNews = (item: NewsItem) => {
    setEditId(item.id);
    setNewsForm({
      title: item.title,
      description: item.description || '',
      published_date: toDateInput(item.published_date),
      is_published: item.is_published !== false,
    });
    setErrors({});
    setShowModal(true);
  };

  const openEditEvent = (item: EventItem) => {
    setEditId(item.id);
    setEventForm({
      title: item.title,
      description: item.description || '',
      event_date: toDateInput(item.event_date),
      event_time: toTimeInput(item.event_time),
      end_time: toTimeInput(item.end_time),
      location: item.location || '',
      event_type: item.event_type || 'General',
      age_groups: item.age_groups || '',
      image_url: item.image_url || '',
      is_published: item.is_published !== false,
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditId(null);
    setErrors({});
  };

  /* ----------------------------------------------------------------- save */

  const save = async () => {
    const found = isNews ? validateNews(newsForm) : validateEvent(eventForm);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      setToast({ message: 'Please fix the highlighted fields', type: 'error' });
      return;
    }

    const path = isNews ? '/admin/news' : '/admin/events';
    const body = isNews
      ? {
          title: newsForm.title.trim(),
          description: newsForm.description.trim(),
          published_date: newsForm.published_date,
          is_published: newsForm.is_published,
        }
      : {
          title: eventForm.title.trim(),
          description: eventForm.description.trim(),
          event_date: eventForm.event_date,
          event_time: eventForm.event_time || null,
          end_time: eventForm.end_time || null,
          location: eventForm.location.trim() || null,
          event_type: eventForm.event_type,
          age_groups: eventForm.age_groups.trim() || null,
          image_url: eventForm.image_url.trim() || null,
          is_published: eventForm.is_published,
        };

    setSaving(true);
    try {
      if (editId) {
        await api(`${path}/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api(path, { method: 'POST', body: JSON.stringify(body) });
      }
      setToast({
        message: `${isNews ? 'News item' : 'Event'} ${editId ? 'updated' : 'created'}`,
        type: 'success',
      });
      setShowModal(false);
      setEditId(null);
      setNewsForm(EMPTY_NEWS);
      setEventForm(EMPTY_EVENT);
      // Back to page 1 after a create: both lists are date-ordered, so a new
      // row will not necessarily be on whichever page is open.
      const current = isNews ? newsPage.page : eventsPage.page;
      fetchData(tab, editId ? current : 1);
    } catch (err) {
      // Surfaces the server's own message so a rejected field is actionable.
      setToast({ message: err instanceof Error ? err.message : 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { id, tab: which } = confirmDelete;
    setConfirmDelete(null);
    try {
      await api(`${which === 'news' ? '/admin/news' : '/admin/events'}/${id}`, { method: 'DELETE' });
      setToast({ message: `${which === 'news' ? 'News item' : 'Event'} deleted`, type: 'success' });
      fetchData(which, which === 'news' ? newsPage.page : eventsPage.page);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to delete', type: 'error' });
    }
  };

  const setNewsField = <K extends keyof NewsForm>(key: K, value: NewsForm[K]) => {
    setNewsForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const setEventField = <K extends keyof EventForm>(key: K, value: EventForm[K]) => {
    setEventForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  /* -------------------------------------------------------------- columns */

  const newsColumns: Column<NewsItem>[] = [
    { key: 'title', header: 'Title', sortable: true, render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'published_date', header: 'Date', render: (r) => <span className="text-xs text-zinc-400">{formatDate(r.published_date)}</span> },
    { key: 'is_published', header: 'Status', render: (r) => <StatusPill published={r.is_published} /> },
    {
      key: 'actions', header: '', className: 'w-[150px]',
      render: (r) => <RowActions onEdit={() => openEditNews(r)} onDelete={() => setConfirmDelete({ id: r.id, tab: 'news' })} />,
    },
  ];

  const eventColumns: Column<EventItem>[] = [
    { key: 'title', header: 'Title', sortable: true, render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'event_date', header: 'Date', render: (r) => <span className="text-xs text-zinc-400">{formatDate(r.event_date)}</span> },
    {
      key: 'event_type', header: 'Type',
      render: (r) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
          {r.event_type || 'General'}
        </span>
      ),
    },
    { key: 'is_published', header: 'Status', render: (r) => <StatusPill published={r.is_published} /> },
    {
      key: 'actions', header: '', className: 'w-[150px]',
      render: (r) => <RowActions onEdit={() => openEditEvent(r)} onDelete={() => setConfirmDelete({ id: r.id, tab: 'events' })} />,
    },
  ];

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'news', label: 'News', count: newsPage.total },
    { key: 'events', label: 'Events', count: eventsPage.total },
  ];

  /* --------------------------------------------------------------- render */

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800" role="tablist" aria-label="Content type">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`relative px-5 py-3 text-sm font-medium transition-colors duration-200 border-b-2 -mb-px focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-t-lg ${
                active
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full transition-colors ${
                  active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search + add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={isNews ? 'Search news...' : 'Search events...'}
          />
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto shrink-0">
          {isNews ? '+ Add News' : '+ Add Event'}
        </Button>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}{' '}
          <button onClick={() => fetchData(tab, 1)} className="underline hover:text-red-300">
            Retry
          </button>
        </div>
      )}

      {/* Only the active tab's table is mounted, so the two never disagree. */}
      <div key={tab} className="animate-in fade-in duration-200">
        {isNews ? (
          <DataTable
            columns={newsColumns}
            data={news}
            loading={loading}
            pagination={newsPage}
            onPageChange={(p) => fetchData('news', p)}
            emptyMessage={search ? 'No news matches that search.' : 'No news yet. Use “+ Add News” to publish the first item.'}
          />
        ) : (
          <DataTable
            columns={eventColumns}
            data={events}
            loading={loading}
            pagination={eventsPage}
            onPageChange={(p) => fetchData('events', p)}
            emptyMessage={search ? 'No events match that search.' : 'No events yet. Use “+ Add Event” to create one.'}
          />
        )}
      </div>

      {/* Create / edit */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={`${editId ? 'Edit' : 'Add'} ${isNews ? 'News' : 'Event'}`}
        maxWidth={isNews ? 'max-w-xl' : 'max-w-2xl'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {isNews ? (
            <>
              <FormField label="Title *" error={errors.title}>
                <Input
                  value={newsForm.title}
                  onChange={(e) => setNewsField('title', e.target.value)}
                  placeholder="New playground opens"
                  maxLength={255}
                />
              </FormField>

              <FormField label="Description *" error={errors.description}>
                <Textarea
                  value={newsForm.description}
                  onChange={(e) => setNewsField('description', e.target.value)}
                  rows={7}
                  placeholder="What would you like parents to know?"
                />
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Date *" error={errors.published_date}>
                  <Input
                    type="date"
                    value={newsForm.published_date}
                    onChange={(e) => setNewsField('published_date', e.target.value)}
                  />
                </FormField>
                <FormField label="Status">
                  <Select
                    value={newsForm.is_published ? 'published' : 'draft'}
                    onChange={(e) => setNewsField('is_published', e.target.value === 'published')}
                    options={STATUS_OPTIONS}
                  />
                </FormField>
              </div>
            </>
          ) : (
            <>
              <FormField label="Title *" error={errors.title}>
                <Input
                  value={eventForm.title}
                  onChange={(e) => setEventField('title', e.target.value)}
                  placeholder="End of Year Celebration"
                  maxLength={255}
                />
              </FormField>

              <FormField label="Description *" error={errors.description}>
                <Textarea
                  value={eventForm.description}
                  onChange={(e) => setEventField('description', e.target.value)}
                  rows={5}
                  placeholder="What is planned?"
                />
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField label="Date *" error={errors.event_date}>
                  <Input type="date" value={eventForm.event_date} onChange={(e) => setEventField('event_date', e.target.value)} />
                </FormField>
                <FormField label="Start Time" error={errors.event_time}>
                  <Input type="time" value={eventForm.event_time} onChange={(e) => setEventField('event_time', e.target.value)} />
                </FormField>
                <FormField label="End Time" error={errors.end_time}>
                  <Input type="time" value={eventForm.end_time} onChange={(e) => setEventField('end_time', e.target.value)} />
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Category">
                  <Select
                    value={eventForm.event_type}
                    onChange={(e) => setEventField('event_type', e.target.value)}
                    options={TYPE_OPTIONS}
                  />
                </FormField>
                <FormField label="Status">
                  <Select
                    value={eventForm.is_published ? 'published' : 'draft'}
                    onChange={(e) => setEventField('is_published', e.target.value === 'published')}
                    options={STATUS_OPTIONS}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Location">
                  <Input value={eventForm.location} onChange={(e) => setEventField('location', e.target.value)} placeholder="Main Hall" maxLength={255} />
                </FormField>
                <FormField label="Age Groups">
                  <Input value={eventForm.age_groups} onChange={(e) => setEventField('age_groups', e.target.value)} placeholder="All ages" maxLength={255} />
                </FormField>
              </div>

              <FormField label="Image URL" error={errors.image_url}>
                <Input value={eventForm.image_url} onChange={(e) => setEventField('image_url', e.target.value)} placeholder="https://..." />
              </FormField>
              {eventForm.image_url.trim() && !errors.image_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={eventForm.image_url.trim()}
                  alt=""
                  className="h-28 w-full rounded-lg border border-zinc-800 object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-zinc-800/50 pt-4">
            <Button variant="secondary" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving
                ? 'Saving…'
                : editId
                  ? 'Save Changes'
                  : isNews ? 'Create News' : 'Create Event'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title={`Delete ${confirmDelete?.tab === 'news' ? 'News Item' : 'Event'}`}
        message="This moves the item to the recycle bin, where it can be restored."
        confirmLabel="Delete"
        destructive
      />
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
