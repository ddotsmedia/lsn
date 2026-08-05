'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import type { PaginatedResponse } from '../../../lib/api';
import { DataTable } from '../../../components/admin/DataTable';
import type { Column } from '../../../components/admin/DataTable';
import { StatusBadge, FilterSelect } from '../../../components/admin/shared';

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  admin_name: string;
  admin_email: string;
  created_at: string;
}

export default function ActivityLogPage() {
  const [data, setData] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api<PaginatedResponse<Activity>>('/admin/users/activity-log', {
        params: { page, limit: 30, entityType, action },
      });
      setData(res.data);
      setPagination(res.pagination);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [entityType, action]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: Column<Activity>[] = [
    { key: 'created_at', header: 'Time', render: (r) => (
      <span className="text-xs text-zinc-400 tabular-nums whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</span>
    )},
    { key: 'admin_name', header: 'User', render: (r) => (
      <div>
        <span className="text-sm text-zinc-300">{r.admin_name || 'System'}</span>
        {r.admin_email && <span className="block text-[10px] text-zinc-600">{r.admin_email}</span>}
      </div>
    )},
    { key: 'action', header: 'Action', render: (r) => <StatusBadge status={r.action} /> },
    { key: 'entity_type', header: 'Entity', render: (r) => (
      <span className="text-sm text-zinc-400">{r.entity_type}{r.entity_id ? ` #${r.entity_id.slice(0, 8)}` : ''}</span>
    )},
    { key: 'details', header: 'Details', render: (r) => (
      r.details ? (
        <span className="text-xs text-zinc-500 max-w-[200px] truncate block">
          {JSON.stringify(r.details).slice(0, 80)}
        </span>
      ) : <span className="text-zinc-600">—</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <FilterSelect
          value={entityType}
          onChange={setEntityType}
          options={[
            { value: 'registration', label: 'Registration' },
            { value: 'tour_booking', label: 'Booking' },
            { value: 'gallery_image', label: 'Gallery' },
            { value: 'gallery_category', label: 'Category' },
            { value: 'news_event', label: 'Event' },
            { value: 'facility', label: 'Facility' },
            { value: 'page', label: 'Page' },
            { value: 'site_settings', label: 'Settings' },
            { value: 'user', label: 'User' },
          ]}
          allLabel="All Entities"
        />
        <FilterSelect
          value={action}
          onChange={setAction}
          options={[
            { value: 'create', label: 'Create' },
            { value: 'update', label: 'Update' },
            { value: 'delete', label: 'Delete' },
            { value: 'status_change', label: 'Status Change' },
            { value: 'upload', label: 'Upload' },
            { value: 'invite', label: 'Invite' },
          ]}
          allLabel="All Actions"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchData(p)}
        emptyMessage="No activity logged yet"
      />
    </div>
  );
}
