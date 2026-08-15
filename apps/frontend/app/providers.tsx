'use client';

/**
 * Application Providers
 * Wraps the entire app with required context providers
 * Order matters: QueryClientProvider should be outer for best integration
 */

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupApiClient } from '../lib/api-client';
import { getRetryConfig } from '../lib/query-error-handler';

// Initialize API client on first load
setupApiClient();

/**
 * Create query client with enterprise defaults
 */
function createQueryClient(): QueryClient {
  const retryConfig = getRetryConfig(true);

  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache configuration
        gcTime: 5 * 60 * 1000, // 5 minutes - Keep unused data in cache for 5 minutes
        staleTime: 30 * 1000, // 30 seconds - Data is fresh for 30 seconds
        refetchOnWindowFocus: true, // Refetch when window regains focus
        refetchOnReconnect: true, // Refetch when reconnecting
        refetchOnMount: true, // Refetch on component mount if stale

        // Retry configuration with exponential backoff
        ...retryConfig,

        // Real-time updates (WebSocket/polling)
        // Will be overridden on per-query basis as needed
      },

      mutations: {
        // Retry mutation failures (less aggressive than queries)
        retry: 1,
        retryDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
      },
    },
  });
}

/**
 * Singleton instance of QueryClient
 * Prevents recreation on every render
 */
let queryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}

/**
 * Providers component
 * Wraps app with all necessary context providers
 *
 * @param children - React components to wrap
 */
export function Providers({ children }: { children: ReactNode }): ReactNode {
  const client = getQueryClient();

  return (
    <QueryClientProvider client={client}>
      {/* All other providers will be added here as needed */}
      {children}
    </QueryClientProvider>
  );
}

/**
 * Export QueryClient instance for use in tests and custom hooks
 */
export { getQueryClient };
