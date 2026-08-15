/**
 * API Response Types
 * Centralized type definitions for all API responses
 * Ensures type safety across queries and mutations
 */

/**
 * Standard HTTP status codes
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * API Error response structure
 */
export interface ApiError {
  status: HttpStatusCode;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: HttpStatusCode;
}

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
  totalStudents: number;
  totalRegistrations: number;
  pageViews: number;
  visitedPages: Array<{
    path: string;
    count: number;
  }>;
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
  events: {
    total: number;
  };
  pages: {
    total: number;
    published: number;
    draft: number;
  };
  gallery: {
    total_images: number;
    total_categories: number;
  };
  analytics: {
    viewsToday: number;
    viewsWeek: number;
  };
  recentActivity: Activity[];
  degraded?: string[];
}

/**
 * Activity log entry
 */
export interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  admin_name: string;
  created_at: string;
  details: Record<string, unknown>;
}

/**
 * Content item (for pages, blog posts, etc.)
 */
export interface Content {
  id: string;
  title: string;
  description: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  categoryId: string;
  category?: string;
  featuredImage?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  viewCount?: number;
}

/**
 * User item
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent' | 'guest';
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

/**
 * Settings object
 */
export interface AdminSettings {
  id?: string;
  userId?: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  defaultView: string;
  itemsPerPage: number;
  dateFormat: string;
  timeFormat: string;
  [key: string]: unknown;
}

/**
 * Query options configuration
 */
export interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
  staleTime?: number;
  gcTime?: number;
  retry?: number | boolean;
  retryDelay?: (attempt: number) => number;
}

/**
 * Mutation options configuration
 */
export interface MutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  onSettled?: () => void;
}

/**
 * List filter options
 */
export interface ListFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  role?: string;
}

/**
 * API error response from server
 */
export class ApiResponseError extends Error implements ApiError {
  status: HttpStatusCode;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
  timestamp?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiResponseError';
    this.status = error.status;
    this.message = error.message;
    this.error = error.error;
    this.details = error.details;
    this.timestamp = error.timestamp;
  }
}
