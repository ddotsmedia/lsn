'use client';

/**
 * Application Providers
 * Wraps the entire app with required context providers
 * Order matters: QueryClientProvider should be outer for best integration
 */

import { ReactNode, useState } from 'react';
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
        gcTime: 5 * 60 * 1000,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        ...retryConfig,
      },
      mutations: {
        retry: 1,
        retryDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
      },
    },
  });
}

/**
 * Providers component
 * Uses useState to create a per-component-instance QueryClient,
 * preventing SSR data leaks between requests.
 */
export function Providers({ children }: { children: ReactNode }): ReactNode {
  const [client] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Export factory for use in tests
 */
export { createQueryClient };
