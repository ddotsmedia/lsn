/**
 * React Query Cache Keys
 * Centralized cache key factory to prevent typos and inconsistencies
 * All keys are grouped by entity type for easy management
 */

import type { ListFilterOptions } from './api-types';

/**
 * Cache key factory functions
 * Using a factory pattern to ensure consistent and type-safe cache keys
 */
export const queryKeys = {
  /**
   * Dashboard metrics and overview
   */
  dashboard: {
    all: () => ['dashboard'],
    metrics: () => [...queryKeys.dashboard.all(), 'metrics'],
    overview: () => [...queryKeys.dashboard.all(), 'overview'],
    recentActivity: () => [...queryKeys.dashboard.all(), 'recentActivity'],
  },

  /**
   * Content (pages, blog posts, etc.)
   */
  content: {
    all: () => ['content'],
    lists: () => [...queryKeys.content.all(), 'list'],
    list: (filters?: ListFilterOptions) =>
      filters
        ? [...queryKeys.content.lists(), { ...filters }]
        : [...queryKeys.content.lists()],
    detail: (id: string) => [...queryKeys.content.all(), 'detail', id],
    search: (query: string) => [...queryKeys.content.all(), 'search', query],
  },

  /**
   * Users and permissions
   */
  users: {
    all: () => ['users'],
    lists: () => [...queryKeys.users.all(), 'list'],
    list: (filters?: ListFilterOptions) =>
      filters
        ? [...queryKeys.users.lists(), { ...filters }]
        : [...queryKeys.users.lists()],
    detail: (id: string) => [...queryKeys.users.all(), 'detail', id],
    search: (query: string) => [...queryKeys.users.all(), 'search', query],
    byRole: (role: string) => [...queryKeys.users.all(), 'role', role],
  },

  /**
   * Admin settings
   */
  settings: {
    all: () => ['settings'],
    global: () => [...queryKeys.settings.all(), 'global'],
    user: (userId: string) => [...queryKeys.settings.all(), 'user', userId],
    theme: () => [...queryKeys.settings.all(), 'theme'],
    notifications: () => [...queryKeys.settings.all(), 'notifications'],
  },

  /**
   * Analytics and reporting
   */
  analytics: {
    all: () => ['analytics'],
    overview: () => [...queryKeys.analytics.all(), 'overview'],
    pageViews: () => [...queryKeys.analytics.all(), 'pageViews'],
    userActivity: () => [...queryKeys.analytics.all(), 'userActivity'],
    timeRange: (start: string, end: string) => [
      ...queryKeys.analytics.all(),
      'timeRange',
      { start, end },
    ],
  },

  /**
   * Registrations
   */
  registrations: {
    all: () => ['registrations'],
    lists: () => [...queryKeys.registrations.all(), 'list'],
    list: (filters?: ListFilterOptions) =>
      filters
        ? [...queryKeys.registrations.lists(), { ...filters }]
        : [...queryKeys.registrations.lists()],
    detail: (id: string) => [...queryKeys.registrations.all(), 'detail', id],
    byStatus: (status: string) => [
      ...queryKeys.registrations.all(),
      'status',
      status,
    ],
  },

  /**
   * Bookings
   */
  bookings: {
    all: () => ['bookings'],
    lists: () => [...queryKeys.bookings.all(), 'list'],
    list: (filters?: ListFilterOptions) =>
      filters
        ? [...queryKeys.bookings.lists(), { ...filters }]
        : [...queryKeys.bookings.lists()],
    detail: (id: string) => [...queryKeys.bookings.all(), 'detail', id],
    byStatus: (status: string) => [
      ...queryKeys.bookings.all(),
      'status',
      status,
    ],
  },

  /**
   * Media and gallery
   */
  media: {
    all: () => ['media'],
    list: (filters?: ListFilterOptions) => [
      ...queryKeys.media.all(),
      'list',
      { ...filters },
    ],
    detail: (id: string) => [...queryKeys.media.all(), 'detail', id],
    gallery: () => [...queryKeys.media.all(), 'gallery'],
  },

  /**
   * Events
   */
  events: {
    all: () => ['events'],
    lists: () => [...queryKeys.events.all(), 'list'],
    list: (filters?: ListFilterOptions) =>
      filters
        ? [...queryKeys.events.lists(), { ...filters }]
        : [...queryKeys.events.lists()],
    detail: (id: string) => [...queryKeys.events.all(), 'detail', id],
    upcoming: () => [...queryKeys.events.all(), 'upcoming'],
  },

  /**
   * Classes and age groups
   */
  classes: {
    all: () => ['classes'],
    lists: () => [...queryKeys.classes.all(), 'list'],
    list: (filters?: ListFilterOptions) =>
      filters
        ? [...queryKeys.classes.lists(), { ...filters }]
        : [...queryKeys.classes.lists()],
    detail: (id: string) => [...queryKeys.classes.all(), 'detail', id],
  },

  /**
   * Activity logs
   */
  activityLog: {
    all: () => ['activityLog'],
    list: (filters?: ListFilterOptions) => [
      ...queryKeys.activityLog.all(),
      'list',
      { ...filters },
    ],
    byUser: (userId: string) => [
      ...queryKeys.activityLog.all(),
      'user',
      userId,
    ],
    byEntity: (entityType: string, entityId: string) => [
      ...queryKeys.activityLog.all(),
      entityType,
      entityId,
    ],
  },
};

/**
 * Type-safe cache key validator
 * Helps catch cache key typos at development time
 */
export function isCacheKeyValid(key: unknown[]): key is (string | number | object)[] {
  return Array.isArray(key) && key.length > 0;
}
