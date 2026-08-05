'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { StatCard, StatusBadge } from '../../../components/admin/shared';

interface DashboardData {
  registrations: { total: number; pending: number; approved: number; rejected: number; last_30_days: number };
  bookings: { total: number; pending: number; confirmed: number; cancelled: number; upcoming: number };
  events: { total: number };
  pages: { total: number; published: number; draft: number };
  gallery: { total_images: number; total_categories: number };
  analytics: { viewsToday: number; viewsWeek: number };
  recentActivity: Array<{
    id: string; action: string; entity_type: string; entity_id: string;
    admin_name: string; created_at: string; details: Record<string, unknown>;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<DashboardData>('/admin/users/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-zinc-500">Failed to load dashboard</p>;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Registrations" value={data.registrations.total} sublabel={`${data.registrations.pending} pending`} accent="emerald" />
        <StatCard label="Tour Bookings" value={data.bookings.total} sublabel={`${data.bookings.upcoming} upcoming`} accent="blue" />
        <StatCard label="Page Views Today" value={data.analytics.viewsToday} sublabel={`${data.analytics.viewsWeek} this week`} accent="purple" />
        <StatCard label="Gallery" value={data.gallery.total_images} sublabel={`${data.gallery.total_categories} categories`} accent="amber" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="News & Events" value={data.events.total} accent="blue" />
        <StatCard label="Pages" value={data.pages.total} sublabel={`${data.pages.published} published`} accent="emerald" />
        <StatCard label="Pending Registrations" value={data.registrations.pending} accent="amber" />
        <StatCard label="Pending Bookings" value={data.bookings.pending} accent="amber" />
      </div>

      {/* Registration status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111119] rounded-xl border border-zinc-800/50 p-6">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">Registration Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Approved', value: data.registrations.approved, color: 'bg-emerald-500' },
              { label: 'Pending', value: data.registrations.pending, color: 'bg-amber-500' },
              { label: 'Rejected', value: data.registrations.rejected, color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-sm text-zinc-400 flex-1">{item.label}</span>
                <span className="text-sm font-medium text-zinc-200 tabular-nums">{item.value}</span>
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${data.registrations.total > 0 ? (item.value / data.registrations.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111119] rounded-xl border border-zinc-800/50 p-6">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">Booking Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Confirmed', value: data.bookings.confirmed, color: 'bg-emerald-500' },
              { label: 'Pending', value: data.bookings.pending, color: 'bg-amber-500' },
              { label: 'Cancelled', value: data.bookings.cancelled, color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-sm text-zinc-400 flex-1">{item.label}</span>
                <span className="text-sm font-medium text-zinc-200 tabular-nums">{item.value}</span>
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${data.bookings.total > 0 ? (item.value / data.bookings.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#111119] rounded-xl border border-zinc-800/50 p-6">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">Recent Activity</h3>
        {data.recentActivity.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {data.recentActivity.map((act) => (
              <div key={act.id} className="flex items-center gap-3 text-sm">
                <StatusBadge status={act.action} />
                <span className="text-zinc-400">{act.admin_name || 'System'}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300">{act.entity_type}</span>
                <span className="text-zinc-600 text-xs ml-auto">
                  {new Date(act.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
