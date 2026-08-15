/**
 * Content List Query Hook
 * Fetches paginated content with filtering and sorting
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/cache-keys';
import type { Content, ListFilterOptions, PaginationResponse } from '../../lib/api-types';

/**
 * Content list query options
 */
export interface UseContentListOptions extends ListFilterOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
}

/**
 * Fetch content list from API
 */
async function fetchContentList(
  options: UseContentListOptions,
): Promise<PaginationResponse<Content>> {
  const params = new URLSearchParams();

  if (options.page !== undefined) params.append('page', String(options.page));
  if (options.limit !== undefined) params.append('limit', String(options.limit));
  if (options.search) params.append('search', options.search);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);
  if (options.status) params.append('status', options.status);

  const query = params.toString();
  const url = query ? `/api/admin/content?${query}` : '/api/admin/content';

  const response = await apiClient.get<PaginationResponse<Content>>(url);
  return response;
}

/**
 * Hook to fetch paginated content list
 * Supports pagination, searching, filtering, and sorting
 *
 * @param options - Query options with filters
 * @returns Query result with paginated content
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useContentList({
 *   page: 1,
 *   limit: 20,
 *   search: 'about',
 *   status: 'published',
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc',
 * });
 *
 * return (
 *   <div>
 *     {data?.data.map(item => (
 *       <div key={item.id}>{item.title}</div>
 *     ))}
 *     <p>Total: {data?.pagination.total}</p>
 *   </div>
 * );
 * ```
 */
export function useContentList(
  options: UseContentListOptions = {},
): UseQueryResult<PaginationResponse<Content>, Error> {
  const {
    page = 1,
    limit = 20,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status = '',
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refetchInterval = false,
  } = options;

  return useQuery<PaginationResponse<Content>, Error>({
    queryKey: queryKeys.content.list({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      status,
    }),
    queryFn: () =>
      fetchContentList({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        status,
      }),
    enabled,
    staleTime,
    refetchInterval,
    retry: 2,
  });
}

/**
 * Hook to search content
 * Specialized for search functionality with real-time updates
 */
export function useContentSearch(
  query: string,
  options: Omit<UseContentListOptions, 'search'> = {},
): UseQueryResult<PaginationResponse<Content>, Error> {
  const { enabled = !!query, staleTime = 2 * 60 * 1000, ...rest } = options;

  return useQuery<PaginationResponse<Content>, Error>({
    queryKey: queryKeys.content.search(query),
    queryFn: () =>
      fetchContentList({
        ...rest,
        search: query,
        page: 1,
      }),
    enabled,
    staleTime,
    retry: 1,
  });
}

/**
 * Hook to fetch content by status filter
 */
export function useContentByStatus(
  status: 'draft' | 'published' | 'archived',
  options: Omit<UseContentListOptions, 'status'> = {},
): UseQueryResult<PaginationResponse<Content>, Error> {
  return useContentList({
    ...options,
    status,
  });
}
