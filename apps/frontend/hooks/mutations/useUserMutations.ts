/**
 * User Mutation Hooks
 * Handles creating, updating, and deleting users
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/cache-keys';
import type { User, MutationOptions } from '../../lib/api-types';

/**
 * Create user input
 */
export interface CreateUserInput {
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent' | 'guest';
  password: string;
}

/**
 * Update user input
 */
export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'teacher' | 'parent' | 'guest';
  status?: 'active' | 'inactive' | 'suspended';
}

/**
 * Hook to create new user
 * Invalidates user list cache on success
 *
 * @param options - Mutation options
 * @returns Mutation result
 */
export function useCreateUser(
  options?: MutationOptions<User>,
): UseMutationResult<User, Error, CreateUserInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const response = await apiClient.post<User>('/api/admin/users', input);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error as any);
    },
  });
}

/**
 * Hook to update existing user
 * Invalidates both list and detail cache
 *
 * @param options - Mutation options
 * @returns Mutation result
 */
export function useUpdateUser(
  options?: MutationOptions<User>,
): UseMutationResult<User, Error, UpdateUserInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const { id, ...data } = input;
      const response = await apiClient.put<User>(`/api/admin/users/${id}`, data);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(data.id) });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error as any);
    },
  });
}

/**
 * Hook to delete user
 * Removes user and invalidates caches
 *
 * @param options - Mutation options
 * @returns Mutation result
 */
export function useDeleteUser(
  options?: MutationOptions<void>,
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error as any);
    },
  });
}

/**
 * Hook to change user password
 */
export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * Hook to change user password
 */
export function useChangeUserPassword(
  options?: MutationOptions<{ success: boolean }>,
): UseMutationResult<{ success: boolean }, Error, ChangePasswordInput> {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const { userId, ...data } = input;
      const response = await apiClient.post<{ success: boolean }>(
        `/api/admin/users/${userId}/change-password`,
        data,
      );
      return response;
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error as any);
    },
  });
}

/**
 * Hook to reset user password (admin action)
 */
export interface ResetPasswordInput {
  userId: string;
  newPassword: string;
}

/**
 * Hook to reset user password
 */
export function useResetUserPassword(
  options?: MutationOptions<{ success: boolean }>,
): UseMutationResult<{ success: boolean }, Error, ResetPasswordInput> {
  return useMutation({
    mutationFn: async (input: ResetPasswordInput) => {
      const { userId, ...data } = input;
      const response = await apiClient.post<{ success: boolean }>(
        `/api/admin/users/${userId}/reset-password`,
        data,
      );
      return response;
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error as any);
    },
  });
}
