/**
 * Query Error Hook
 * Provides centralized error handling for queries and mutations
 */

import { useCallback, useEffect, useState } from 'react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import type { ApiError, ApiResponseError } from '../lib/api-types';
import { classifyError, ErrorType, getErrorMessage, isOffline } from '../lib/query-error-handler';

/**
 * Error state
 */
export interface ErrorState {
  error: Error | null;
  errorType: ErrorType;
  message: string;
  isOffline: boolean;
  isRetryable: boolean;
}

/**
 * Hook to use query errors
 * Provides centralized error handling and recovery
 *
 * @example
 * ```typescript
 * const { error, isOffline, retry } = useQueryError();
 *
 * if (error) {
 *   return (
 *     <div className="error-banner">
 *       <p>{error.message}</p>
 *       {isOffline && <p>You are offline</p>}
 *       <button onClick={retry}>Retry</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useQueryError(): ErrorState & {
  clearError: () => void;
  retry: () => void;
} {
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { reset } = useQueryErrorResetBoundary();

  const errorType = classifyError(error);
  const message = getErrorMessage(error, 'An error occurred');
  const offline = isOffline();
  const isRetryable = errorType !== ErrorType.FORBIDDEN && errorType !== ErrorType.UNAUTHORIZED;

  // Listen to global error events
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Listen to unhandled rejection events
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      setError(event.reason);
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    reset();
  }, [reset]);

  const retry = useCallback(async () => {
    if (!isRetryable) return;

    setIsRetrying(true);
    try {
      // Wait a moment before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
      clearError();
    } finally {
      setIsRetrying(false);
    }
  }, [isRetryable, clearError]);

  return {
    error,
    errorType,
    message,
    isOffline: offline,
    isRetryable,
    clearError,
    retry,
  };
}

/**
 * Hook to handle specific error types
 *
 * @param callback - Function to call when error occurs
 * @param errorTypes - Specific error types to handle
 *
 * @example
 * ```typescript
 * useErrorHandler((error) => {
 *   console.log('Handling unauthorized:', error);
 * }, [ErrorType.UNAUTHORIZED]);
 * ```
 */
export function useErrorHandler(
  callback: (error: Error) => void,
  errorTypes?: ErrorType[],
): void {
  const { error, errorType } = useQueryError();

  useEffect(() => {
    if (!error) return;

    // Call callback if no specific error types specified,
    // or if current error type is in the list
    if (!errorTypes || errorTypes.includes(errorType)) {
      callback(error);
    }
  }, [error, errorType, callback, errorTypes]);
}

/**
 * Hook to show offline indicator
 *
 * @returns Whether user is offline
 *
 * @example
 * ```typescript
 * const isOffline = useOfflineIndicator();
 *
 * return (
 *   <>
 *     {isOffline && <div className="offline-banner">You are offline</div>}
 *   </>
 * );
 * ```
 */
export function useOfflineIndicator(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return offline;
}

/**
 * Hook to retry failed queries
 * Can be called from error boundary or error UI
 *
 * @example
 * ```typescript
 * const retryFailedQuery = useRetryFailedQuery();
 *
 * return (
 *   <button onClick={retryFailedQuery}>
 *     Retry
 *   </button>
 * );
 * ```
 */
export function useRetryFailedQuery(): () => void {
  const { reset } = useQueryErrorResetBoundary();

  return useCallback(() => {
    reset();
  }, [reset]);
}
