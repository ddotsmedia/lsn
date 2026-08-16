'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, BookOpen, Calendar, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { KPICard } from '@/components/KPICard';
import { AttentionRequired } from '@/components/AttentionRequired';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useDashboardStats();

  // Generate attention items from stats
  const attentionItems = stats
    ? [
        ...(stats.registrations.pending > 0
          ? [{
              id: 'pending-regs',
              type: 'registration' as const,
              title: 'Pending Registrations',
              description: `${stats.registrations.pending} awaiting approval`,
              urgency: 'high' as const,
              link: '/admin/registrations?status=pending',
              count: stats.registrations.pending,
            }]
          : []),
        ...(stats.bookings.upcoming > 0
          ? [{
              id: 'upcoming-tours',
              type: 'tour' as const,
              title: 'Upcoming Tours',
              description: `${stats.bookings.upcoming} scheduled tours`,
              urgency: 'medium' as const,
              link: '/admin/bookings?status=upcoming',
              count: stats.bookings.upcoming,
            }]
          : []),
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Dashboard</h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Command center for nursery operations
        </p>
      </div>

      {/* KPI Cards */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Children"
            value={stats?.totalStudents ?? 0}
            icon={<Users size={18} />}
            bgColor="bg-primary-50 dark:bg-primary-900/20"
            isLoading={isLoading}
            subtitle={`${stats?.totalRegistrations ?? 0} registrations`}
          />

          <KPICard
            title="Pending Approvals"
            value={stats?.registrations.pending ?? 0}
            icon={<FileText size={18} />}
            bgColor="bg-accent-50 dark:bg-accent-900/20"
            status={stats && stats.registrations.pending > 5 ? 'warning' : 'normal'}
            isLoading={isLoading}
            subtitle="Awaiting review"
          />

          <KPICard
            title="Upcoming Tours"
            value={stats?.bookings.upcoming ?? 0}
            icon={<Calendar size={18} />}
            bgColor="bg-secondary-50 dark:bg-secondary-900/20"
            isLoading={isLoading}
            subtitle="Scheduled bookings"
          />

          <KPICard
            title="Page Views"
            value={stats?.analytics.viewsToday ?? 0}
            icon={<BarChart3 size={18} />}
            bgColor="bg-success-50 dark:bg-success-900/20"
            isLoading={isLoading}
            subtitle="Today"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registrations & Bookings Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registration & Booking Status</CardTitle>
            <CardDescription>Current state of enrolments and tours</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-700 last:pb-0 last:border-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Registrations */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
                    Registrations
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Total</p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {stats?.registrations.total ?? 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-success-50 dark:bg-success-900/20">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Approved</p>
                      <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                        {stats?.registrations.approved ?? 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent-50 dark:bg-accent-900/20">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Pending</p>
                      <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                        {stats?.registrations.pending ?? 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Rejected</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {stats?.registrations.rejected ?? 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bookings */}
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
                    Tour Bookings
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Total</p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {stats?.bookings.total ?? 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-success-50 dark:bg-success-900/20">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Confirmed</p>
                      <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                        {stats?.bookings.confirmed ?? 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent-50 dark:bg-accent-900/20">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Pending</p>
                      <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                        {stats?.bookings.pending ?? 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Upcoming</p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {stats?.bookings.upcoming ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attention Required */}
        <AttentionRequired
          items={attentionItems}
          isLoading={isLoading}
          isEmpty={stats?.registrations.pending === 0 && stats?.bookings.upcoming === 0}
        />
      </div>

      {/* Content Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Content & Analytics</CardTitle>
          <CardDescription>Website and content performance</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Page Views</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats?.pageViews ?? 0}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Total</p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Today</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {stats?.analytics.viewsToday ?? 0}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Views</p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">This Week</p>
                <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
                  {stats?.analytics.viewsWeek ?? 0}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Views</p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Pages</p>
                <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                  {stats?.pages.published ?? 0}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Published</p>
              </div>
            </div>
          )}

          {/* Top Visited Pages */}
          {stats?.visitedPages && stats.visitedPages.length > 0 && (
            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
                Top Pages
              </h4>
              <div className="space-y-2">
                {stats.visitedPages.slice(0, 5).map((page, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-700 dark:text-neutral-300 truncate">
                      {page.path || '/'}
                    </span>
                    <Badge variant="outline">{page.count} views</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
