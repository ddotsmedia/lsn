/**
 * User List Query Hook
 * Fetches paginated users with role filtering
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/cache-keys';
import type { User, ListFilterOptions, PaginationResponse } from '../../lib/api-types';

/**
 * User list query options
 */
export interface UseUserListOptions extends ListFilterOptions {
  role?: 'admin' | 'teacher' | 'parent' | 'guest';
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
}

/**
 * Fetch users list from API
 */
async function fetchUserList(options: UseUserListOptions): Promise<PaginationResponse<User>> {
  const params = new URLSearchParams();

  if (options.page !== undefined) params.append('page', String(options.page));
  if (options.limit !== undefined) params.append('limit', String(options.limit));
  if (options.search) params.append('search', options.search);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);
  if (options.role) params.append('role', options.role);

  const query = params.toString();
  const url = query ? `/api/admin/users?${query}` : '/api/admin/users';

  const response = await apiClient.get<PaginationResponse<User>>(url);
  return response;
}

/**
 * Hook to fetch paginated user list
 * Supports pagination, searching, filtering by role, and sorting
 *
 * @param options - Query options with filters
 * @returns Query result with paginated users
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useUserList({
 *   page: 1,
 *   limit: 20,
 *   search: 'john',
 *   role: 'teacher',
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc',
 * });
 *
 * return (
 *   <table>
 *     <tbody>
 *       {data?.data.map(user => (
 *         <tr key={user.id}>
 *           <td>{user.name}</td>
 *           <td>{user.role}</td>
 *         </tr>
 *       ))}
 *     </tbody>
 *   </table>
 * );
 * ```
 */
export function useUserList(
  options: UseUserListOptions = {},
): UseQueryResult<PaginationResponse<User>, Error> {
  const {
    page = 1,
    limit = 20,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    role = undefined,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refetchInterval = false,
  } = options;

  return useQuery<PaginationResponse<User>, Error>({
    queryKey: queryKeys.users.list({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      role,
    }),
    queryFn: () =>
      fetchUserList({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        role,
      }),
    enabled,
    staleTime,
    refetchInterval,
    retry: 2,
  });
}

/**
 * Hook to search users
 * Specialized for user search with real-time updates
 */
export function useUserSearch(
  query: string,
  options: Omit<UseUserListOptions, 'search'> = {},
): UseQueryResult<PaginationResponse<User>, Error> {
  const { enabled = !!query, staleTime = 2 * 60 * 1000, ...rest } = options;

  return useQuery<PaginationResponse<User>, Error>({
    queryKey: queryKeys.users.search(query),
    queryFn: () =>
      fetchUserList({
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
 * Hook to fetch users by role
 */
export function useUsersByRole(
  role: 'admin' | 'teacher' | 'parent' | 'guest',
  options: Omit<UseUserListOptions, 'role'> = {},
): UseQueryResult<PaginationResponse<User>, Error> {
  return useUserList({
    ...options,
    role,
  });
}

/**
 * Hook to fetch all teachers
 */
export function useTeachers(options: Omit<UseUserListOptions, 'role'> = {}): UseQueryResult<
  PaginationResponse<User>,
  Error
> {
  return useUsersByRole('teacher', options);
}

/**
 * Hook to fetch all admins
 */
export function useAdmins(options: Omit<UseUserListOptions, 'role'> = {}): UseQueryResult<
  PaginationResponse<User>,
  Error
> {
  return useUsersByRole('admin', options);
}
