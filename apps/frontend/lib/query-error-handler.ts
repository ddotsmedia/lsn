/**
 * Query Error Handler
 * Centralized error handling for React Query
 * Handles different error types with appropriate responses
 */

import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type { ApiError, ApiResponseError } from './api-types';
import { HttpStatusCode } from './api-types';

/**
 * Error handling configuration
 */
export interface ErrorHandlerConfig {
  showToast?: boolean;
  toastMessage?: string;
  logError?: boolean;
  retryable?: boolean;
}

/**
 * Error classification
 */
export enum ErrorType {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Classify error type
 */
export function classifyError(error: unknown): ErrorType {
  if (error instanceof Error) {
    // Check for API response errors
    if ('status' in error) {
      const status = (error as ApiError).status;
      if (status === HttpStatusCode.UNAUTHORIZED) return ErrorType.UNAUTHORIZED;
      if (status === HttpStatusCode.FORBIDDEN) return ErrorType.FORBIDDEN;
      if (status === HttpStatusCode.NOT_FOUND) return ErrorType.NOT_FOUND;
      if (status === HttpStatusCode.BAD_REQUEST) return ErrorType.VALIDATION;
      if (status >= 500) return ErrorType.SERVER_ERROR;
    }

    // Check for network/timeout errors
    if (error.message.includes('fetch') || error.message.includes('Network')) {
      return ErrorType.NETWORK_ERROR;
    }
    if (error.name === 'AbortError') {
      return ErrorType.TIMEOUT;
    }
  }

  return ErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error instanceof Error) {
    if ('message' in error) {
      return error.message;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

/**
 * Handle query error with retry logic
 */
export function createQueryErrorHandler(
  config: ErrorHandlerConfig = {},
): (error: Error) => void {
  return (error: Error) => {
    const errorType = classifyError(error);

    // Log error in development
    if (config.logError !== false && process.env.NODE_ENV === 'development') {
      console.error(`Query Error [${errorType}]:`, error);
    }

    // Handle specific error types
    switch (errorType) {
      case ErrorType.UNAUTHORIZED:
        // Redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lsn_token');
          localStorage.removeItem('lsn_refresh_token');
          window.location.href = '/admin/login';
        }
        break;

      case ErrorType.FORBIDDEN:
        // Show access denied message
        if (config.showToast) {
          console.warn('Access denied - insufficient permissions');
        }
        break;

      case ErrorType.NOT_FOUND:
        // Item not found
        if (config.showToast) {
          console.warn('The requested item was not found');
        }
        break;

      case ErrorType.NETWORK_ERROR:
        // Network error - likely offline
        if (config.showToast) {
          console.warn('Network error - please check your connection');
        }
        break;

      case ErrorType.TIMEOUT:
        // Request timeout
        if (config.showToast) {
          console.warn('Request timeout - please try again');
        }
        break;

      case ErrorType.SERVER_ERROR:
        // Server error
        if (config.showToast) {
          console.warn('Server error - please try again later');
        }
        break;

      default:
        // Unknown error
        if (config.showToast) {
          console.warn(config.toastMessage || 'An error occurred');
        }
    }
  };
}

/**
 * Exponential backoff retry logic
 * Used for automatic retries on failure
 */
export function exponentialBackoff(
  attemptIndex: number,
  maxDelay = 30000,
): number {
  const delay = Math.min(1000 * Math.pow(2, attemptIndex), maxDelay);
  const jitter = Math.random() * delay * 0.1;
  return delay + jitter;
}

/**
 * Determine if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error) || !('status' in error)) {
    // Network errors are retryable
    return true;
  }

  const status = (error as ApiError).status;
  const statusCode = typeof status === 'number' ? status : Number(status);

  // Don't retry 4xx errors (except 408 Request Timeout)
  if (statusCode >= 400 && statusCode < 500) {
    return statusCode === HttpStatusCode.BAD_REQUEST ? false : statusCode === 408;
  }

  // Retry 5xx errors
  return statusCode >= 500;
}

/**
 * Get retry configuration
 */
export function getRetryConfig(shouldRetry = true): {
  retry: number | boolean;
  retryDelay: (attemptIndex: number) => number;
} {
  if (!shouldRetry) {
    return {
      retry: false,
      retryDelay: () => 0,
    };
  }

  return {
    retry: 3, // Max 3 retries
    retryDelay: exponentialBackoff,
  };
}

/**
 * Create error handler for mutations
 */
export function createMutationErrorHandler(
  config: ErrorHandlerConfig = {},
): (error: Error) => void {
  return (error: Error) => {
    const message = getErrorMessage(error, 'Failed to save changes');

    if (config.logError !== false && process.env.NODE_ENV === 'development') {
      console.error('Mutation Error:', error);
    }

    if (config.showToast) {
      console.warn(config.toastMessage || message);
    }
  };
}

/**
 * Check if user is offline
 */
export function isOffline(): boolean {
  if (typeof window === 'undefined') return false;
  return !navigator.onLine;
}

/**
 * Watch online/offline status
 */
export function onlineStatusObserver(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  return () => {};
}
