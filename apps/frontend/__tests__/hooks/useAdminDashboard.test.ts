/**
 * Tests for useAdminDashboard Hook
 * Demonstrates testing React Query hooks with mock data
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useAdminDashboard } from '../../hooks/queries/useAdminDashboard';
import type { DashboardMetrics } from '../../lib/api-types';

// Mock the API client
jest.mock('../../lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

/**
 * Mock dashboard data
 */
const mockDashboardData: DashboardMetrics = {
  totalStudents: 150,
  totalRegistrations: 200,
  pageViews: 5000,
  visitedPages: [
    { path: '/home', count: 1000 },
    { path: '/about', count: 800 },
  ],
  registrations: {
    total: 200,
    pending: 20,
    approved: 170,
    rejected: 10,
    last_30_days: 50,
  },
  bookings: {
    total: 100,
    pending: 10,
    confirmed: 85,
    cancelled: 5,
    upcoming: 30,
  },
  events: {
    total: 12,
  },
  pages: {
    total: 25,
    published: 20,
    draft: 5,
  },
  gallery: {
    total_images: 500,
    total_categories: 10,
  },
  analytics: {
    viewsToday: 1000,
    viewsWeek: 7000,
  },
  recentActivity: [
    {
      id: '1',
      action: 'CREATE',
      entity_type: 'Student',
      entity_id: 'std-1',
      admin_name: 'John Doe',
      created_at: new Date().toISOString(),
      details: {},
    },
  ],
};

/**
 * Create wrapper with QueryClientProvider
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useAdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches dashboard metrics successfully', async () => {
    const { apiClient } = require('../../lib/api-client');
    apiClient.get.mockResolvedValueOnce(mockDashboardData);

    const { result } = renderHook(() => useAdminDashboard(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify data
    expect(result.current.data).toEqual(mockDashboardData);
    expect(result.current.error).toBeNull();
  });

  test('handles error when fetching fails', async () => {
    const { apiClient } = require('../../lib/api-client');
    const error = new Error('Failed to fetch');
    apiClient.get.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useAdminDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  test('respects enabled option', async () => {
    const { apiClient } = require('../../lib/api-client');

    const { result } = renderHook(() => useAdminDashboard({ enabled: false }), {
      wrapper: createWrapper(),
    });

    // Should not fetch when disabled
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  test('refetches at specified interval', async () => {
    const { apiClient } = require('../../lib/api-client');
    apiClient.get.mockResolvedValue(mockDashboardData);

    // Note: Full interval testing would require mocking timers
    // This is a simplified example
    const { result } = renderHook(() => useAdminDashboard({ refetchInterval: 5000 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Initial fetch should occur
    expect(apiClient.get).toHaveBeenCalledWith('/api/admin/dashboard/stats');
  });
});

describe('useDashboardActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches and extracts recent activity', async () => {
    const { apiClient } = require('../../lib/api-client');
    apiClient.get.mockResolvedValueOnce(mockDashboardData);

    const { result } = renderHook(
      () => require('../../hooks/queries/useAdminDashboard').useDashboardActivity(),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockDashboardData.recentActivity);
  });
});
