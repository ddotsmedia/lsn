/**
 * React Query DevTools
 * Development-only placeholder component for React Query debugging
 * In production, this is completely removed
 *
 * To enable actual devtools in development:
 * npm install @tanstack/react-query-devtools
 */

import type { ReactNode } from 'react';

/**
 * DevTools component wrapper
 * Only renders in development mode
 * Currently a placeholder - install @tanstack/react-query-devtools for full functionality
 *
 * @example
 * ```typescript
 * // In your root layout or providers
 * import { QueryClientProvider } from '@tanstack/react-query';
 * import { DevTools } from '../lib/devtools';
 *
 * export function Providers({ children }) {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       {children}
 *       <DevTools />
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */
export function DevTools(): ReactNode {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Placeholder for React Query DevTools
  // When @tanstack/react-query-devtools is installed, uncomment the lazy import below
  /*
  return (
    <div data-testid="react-query-devtools">
      <Suspense fallback={null}>
        <ReactQueryDevtoolsProduction />
      </Suspense>
    </div>
  );
  */

  return null;
}

/**
 * Hook to toggle DevTools visibility
 * Useful for keyboard shortcuts or UI controls
 *
 * @returns Function to toggle visibility
 *
 * @example
 * ```typescript
 * const toggleDevtools = useToggleDevtools();
 *
 * // Listen for keyboard shortcut
 * useEffect(() => {
 *   const handleKeyPress = (e: KeyboardEvent) => {
 *     if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
 *       toggleDevtools();
 *     }
 *   };
 *   window.addEventListener('keydown', handleKeyPress);
 *   return () => window.removeEventListener('keydown', handleKeyPress);
 * }, [toggleDevtools]);
 * ```
 */
export function useToggleDevtools(): () => void {
  return () => {
    if (typeof window !== 'undefined') {
      const current = localStorage.getItem('show-devtools') === 'true';
      localStorage.setItem('show-devtools', String(!current));
      window.location.reload();
    }
  };
}

/**
 * Development utility: Log React Query state
 * Useful for debugging
 *
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/react-query';
 * import { logQueryCache } from '../lib/devtools';
 *
 * // In a component
 * const queryClient = useQueryClient();
 * logQueryCache(queryClient);
 * ```
 */
export function logQueryCache(queryClient: any): void {
  if (process.env.NODE_ENV === 'development') {
    const cache = queryClient.getQueryCache();
    console.group('React Query Cache');
    console.log('Queries:', cache.getAll());
    console.groupEnd();
  }
}
