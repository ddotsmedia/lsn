/**
 * Dashboard Query Hook
 * Fetches admin dashboard metrics and overview data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/cache-keys';
import type { DashboardMetrics } from '../../lib/api-types';

/**
 * Options for dashboard query
 */
export interface UseDashboardOptions {
  refetchInterval?: number | false;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Fetch dashboard metrics from API
 */
async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await apiClient.get<DashboardMetrics>('/api/admin/dashboard/stats');
  return response;
}

/**
 * Hook to fetch dashboard metrics
 * Provides real-time KPI data, charts, and activity feeds
 *
 * @param options - Query options
 * @returns Query result with dashboard metrics
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useAdminDashboard({
 *   refetchInterval: 60000, // Refetch every 60 seconds
 * });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     <p>Total Students: {data?.totalStudents}</p>
 *     <p>Page Views: {data?.pageViews}</p>
 *   </div>
 * );
 * ```
 */
export function useAdminDashboard(
  options: UseDashboardOptions = {},
): UseQueryResult<DashboardMetrics, Error> {
  const {
    refetchInterval = 60000, // 60 seconds for real-time updates
    enabled = true,
    staleTime = 30000, // 30 seconds
  } = options;

  return useQuery<DashboardMetrics, Error>({
    queryKey: queryKeys.dashboard.metrics(),
    queryFn: fetchDashboardMetrics,
    refetchInterval,
    enabled,
    staleTime,
    retry: 3, // Retry 3 times with exponential backoff
    retryDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
  });
}

/**
 * Hook to fetch only recent activity (subset of dashboard)
 * More efficient when you only need activity updates
 */
export function useDashboardActivity(
  options: UseDashboardOptions = {},
): UseQueryResult<DashboardMetrics['recentActivity'], Error> {
  const {
    refetchInterval = 120000, // 2 minutes for activity
    enabled = true,
    staleTime = 60000, // 1 minute
  } = options;

  return useQuery<DashboardMetrics['recentActivity'], Error>({
    queryKey: queryKeys.dashboard.recentActivity(),
    queryFn: async () => {
      const data = await fetchDashboardMetrics();
      return data.recentActivity;
    },
    refetchInterval,
    enabled,
    staleTime,
    retry: 2,
  });
}
