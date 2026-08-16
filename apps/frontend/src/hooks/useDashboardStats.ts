'use client';

import { useQuery } from '@tanstack/react-query';

export interface DashboardStats {
  totalStudents: number;
  totalRegistrations: number;
  pageViews: number;
  visitedPages: Array<{ path: string; count: number }>;
  registrations: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    last_30_days: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    upcoming: number;
  };
  events: { total: number };
  pages: { total: number; published: number; draft: number };
  gallery: { total_images: number; total_categories: number };
  analytics: { viewsToday: number; viewsWeek: number };
  recentActivity: Array<Record<string, unknown>>;
  degraded: string[];
}

export function useDashboardStats(fresh = false) {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', fresh],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      const url = new URL(`${apiUrl}/admin/dashboard/stats`, window.location.origin);

      if (fresh) {
        url.searchParams.set('fresh', 'true');
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
      }

      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 1 * 60 * 1000, // Data is fresh for 1 minute
  });
}
