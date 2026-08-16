/**
 * API Client
 * Centralized HTTP client for all API requests
 * Handles authentication, error handling, and request/response transformation
 */

import { ApiError, ApiResponse, HttpStatusCode, ApiResponseError } from './api-types';

/**
 * API Client Options
 */
export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Request interceptor function
 */
type RequestInterceptor = (config: RequestInit) => RequestInit;

/**
 * Response interceptor function
 */
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

/**
 * Error interceptor function
 */
type ErrorInterceptor = (error: Error) => Error;

/**
 * API Client class
 * Provides centralized HTTP request handling with interceptors
 */
class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_API_URL || '/api';
    this.timeout = options.timeout || 30000;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Apply request interceptors
   */
  private applyRequestInterceptors(config: RequestInit): RequestInit {
    return this.requestInterceptors.reduce((acc, interceptor) => interceptor(acc), config);
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let result = response;
    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  /**
   * Apply error interceptors
   */
  private applyErrorInterceptors(error: Error): Error {
    return this.errorInterceptors.reduce((acc, interceptor) => interceptor(acc), error);
  }

  /**
   * Execute HTTP request
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), this.timeout);

    try {
      let config: RequestInit = {
        method,
        headers: { ...this.headers },
        signal: abortController.signal,
      };

      // Add auth token if available
      const token = typeof window !== 'undefined' ? localStorage.getItem('lsn_token') : null;
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      // Apply request interceptors
      config = this.applyRequestInterceptors(config);

      // Make request
      let response = await fetch(url, config);

      // Apply response interceptors
      response = await this.applyResponseInterceptors(response);

      // Handle error responses
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        const message = typeof errorData.message === 'string'
          ? errorData.message
          : response.statusText || 'Unknown error';
        throw new ApiResponseError({
          status: response.status as HttpStatusCode,
          message,
          error: typeof errorData.error === 'string' ? errorData.error : undefined,
          details: typeof errorData.details === 'object' && errorData.details !== null
            ? (errorData.details as Record<string, unknown>)
            : undefined,
          timestamp: new Date().toISOString(),
        });
      }

      // Parse and return response
      const data = await response.json();
      return data as T;
    } catch (error) {
      let finalError = error instanceof Error ? error : new Error(String(error));
      finalError = this.applyErrorInterceptors(finalError);

      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error(`API ${method} ${path}:`, finalError);
      }

      throw finalError;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse error response from server
   */
  private async parseErrorResponse(response: Response): Promise<Record<string, string | unknown>> {
    try {
      const data = await response.json();
      return data as Record<string, string | unknown>;
    } catch {
      return {
        message: response.statusText || 'Unknown error',
      } as Record<string, string>;
    }
  }

  /**
   * GET request
   */
  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  /**
   * POST request
   */
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  /**
   * PUT request
   */
  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  /**
   * PATCH request
   */
  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  /**
   * DELETE request
   */
  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  /**
   * Set header
   */
  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  /**
   * Remove header
   */
  removeHeader(key: string): void {
    delete this.headers[key];
  }
}

/**
 * Create API client instance
 */
export const apiClient = new ApiClient();

/**
 * Setup API client interceptors
 * This runs once on app startup
 */
export function setupApiClient(): void {
  // Add auth token to all requests
  apiClient.addRequestInterceptor((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lsn_token') : null;
    if (token) {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    }
    return config;
  });

  // Handle 401 Unauthorized responses
  apiClient.addErrorInterceptor((error) => {
    if (error instanceof ApiResponseError && error.status === HttpStatusCode.UNAUTHORIZED) {
      // Clear auth token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lsn_token');
        localStorage.removeItem('lsn_refresh_token');
      }
      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
    return error;
  });
}

/**
 * Export API client for use in queries
 */
export default apiClient;
