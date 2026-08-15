/**
 * Test Utilities for React Query
 * Custom render function that wraps components with QueryClientProvider
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

/**
 * Create a test QueryClient instance
 * Disables retries and sets aggressive garbage collection for faster tests
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retry in tests for faster failures
        gcTime: 0, // Disable garbage collection in tests
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Custom render function for tests
 * Wraps components with QueryClientProvider and other necessary providers
 *
 * @param ui - React component to render
 * @param options - Additional render options
 * @returns Render result with utilities
 *
 * @example
 * ```typescript
 * import { screen } from '@testing-library/react';
 * import { renderWithQuery } from '../test-utils';
 * import { MyComponent } from './MyComponent';
 *
 * test('fetches and displays data', async () => {
 *   renderWithQuery(<MyComponent />);
 *
 *   const element = await screen.findByText(/expected text/i);
 *   expect(element).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithQuery(
  ui: ReactElement,
  { ...renderOptions }: Omit<RenderOptions, 'wrapper'> = {},
) {
  // Create a new QueryClient for each test
  const testQueryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Re-export common testing utilities
 */
export * from '@testing-library/react';
