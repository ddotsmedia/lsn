/**
 * Content Mutation Hooks
 * Handles creating, updating, and deleting content items
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/cache-keys';
import type { Content, MutationOptions } from '../../lib/api-types';

/**
 * Create content input
 */
export interface CreateContentInput {
  title: string;
  description: string;
  content: string;
  status: 'draft' | 'published';
  categoryId: string;
  featuredImage?: string;
}

/**
 * Update content input
 */
export interface UpdateContentInput extends Partial<CreateContentInput> {
  id: string;
}

/**
 * Hook to create new content
 * Invalidates content list cache on success
 *
 * @param options - Mutation options
 * @returns Mutation result
 *
 * @example
 * ```typescript
 * const createContent = useCreateContent({
 *   onSuccess: (data) => {
 *     console.log('Created content:', data.id);
 *   },
 * });
 *
 * const handleCreate = () => {
 *   createContent.mutate({
 *     title: 'New Page',
 *     description: 'Description',
 *     content: 'Content',
 *     status: 'draft',
 *     categoryId: 'cat-1',
 *   });
 * };
 *
 * return (
 *   <button onClick={handleCreate} disabled={createContent.isPending}>
 *     {createContent.isPending ? 'Creating...' : 'Create'}
 *   </button>
 * );
 * ```
 */
export function useCreateContent(
  options?: MutationOptions<Content>,
): UseMutationResult<Content, Error, CreateContentInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContentInput) => {
      const response = await apiClient.post<Content>('/api/admin/content', input);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate content list cache so it refetches
      queryClient.invalidateQueries({ queryKey: queryKeys.content.lists() });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error as any);
    },
    onSettled: () => {
      options?.onSettled?.();
    },
  });
}

/**
 * Hook to update existing content
 * Invalidates both list and detail cache
 *
 * @param options - Mutation options
 * @returns Mutation result
 *
 * @example
 * ```typescript
 * const updateContent = useUpdateContent({
 *   onSuccess: () => {
 *     console.log('Content updated');
 *   },
 * });
 *
 * const handleUpdate = () => {
 *   updateContent.mutate({
 *     id: 'content-1',
 *     title: 'Updated Title',
 *   });
 * };
 * ```
 */
export function useUpdateContent(
  options?: MutationOptions<Content>,
): UseMutationResult<Content, Error, UpdateContentInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateContentInput) => {
      const { id, ...data } = input;
      const response = await apiClient.put<Content>(`/api/admin/content/${id}`, data);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate list and specific item cache
      queryClient.invalidateQueries({ queryKey: queryKeys.content.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.content.detail(data.id) });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error as any);
    },
  });
}

/**
 * Hook to delete content
 * Removes content and invalidates caches
 *
 * @param options - Mutation options
 * @returns Mutation result
 *
 * @example
 * ```typescript
 * const deleteContent = useDeleteContent({
 *   onSuccess: () => {
 *     console.log('Content deleted');
 *   },
 * });
 *
 * const handleDelete = (contentId: string) => {
 *   if (confirm('Delete this content?')) {
 *     deleteContent.mutate(contentId);
 *   }
 * };
 * ```
 */
export function useDeleteContent(
  options?: MutationOptions<void>,
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      await apiClient.delete(`/api/admin/content/${contentId}`);
    },
    onSuccess: () => {
      // Invalidate content list cache
      queryClient.invalidateQueries({ queryKey: queryKeys.content.lists() });
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error as any);
    },
  });
}

/**
 * Hook for batch operations (publish/unpublish multiple items)
 */
export interface BatchContentInput {
  ids: string[];
  status: 'draft' | 'published' | 'archived';
}

/**
 * Hook to batch update content status
 */
export function useBatchUpdateContent(
  options?: MutationOptions<{ updated: number }>,
): UseMutationResult<{ updated: number }, Error, BatchContentInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BatchContentInput) => {
      const response = await apiClient.post<{ updated: number }>(
        '/api/admin/content/batch/status',
        input,
      );
      return response;
    },
    onSuccess: (data) => {
      // Invalidate all content caches
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all() });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error as any);
    },
  });
}
