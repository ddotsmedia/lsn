/**
 * Settings Query Hook
 * Fetches admin settings (global and user-specific)
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/cache-keys';
import type { AdminSettings } from '../../lib/api-types';

/**
 * Settings query options
 */
export interface UseSettingsOptions {
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Fetch global admin settings
 */
async function fetchGlobalSettings(): Promise<AdminSettings> {
  const response = await apiClient.get<AdminSettings>('/api/admin/settings/global');
  return response;
}

/**
 * Fetch user-specific settings
 */
async function fetchUserSettings(userId: string): Promise<AdminSettings> {
  const response = await apiClient.get<AdminSettings>(`/api/admin/settings/user/${userId}`);
  return response;
}

/**
 * Hook to fetch global admin settings
 * Settings are cached for longer (10 minutes) as they change infrequently
 *
 * @param options - Query options
 * @returns Query result with global settings
 *
 * @example
 * ```typescript
 * const { data: settings } = useGlobalSettings();
 *
 * return (
 *   <div>
 *     <p>Theme: {settings?.theme}</p>
 *     <p>Language: {settings?.language}</p>
 *   </div>
 * );
 * ```
 */
export function useGlobalSettings(
  options: UseSettingsOptions = {},
): UseQueryResult<AdminSettings, Error> {
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes - settings change infrequently
  } = options;

  return useQuery<AdminSettings, Error>({
    queryKey: queryKeys.settings.global(),
    queryFn: fetchGlobalSettings,
    enabled,
    staleTime,
    retry: 2,
  });
}

/**
 * Hook to fetch user-specific settings
 * Cached per user ID to handle multiple admin accounts
 *
 * @param userId - User ID to fetch settings for
 * @param options - Query options
 * @returns Query result with user settings
 *
 * @example
 * ```typescript
 * const { data: userSettings } = useUserSettings('user-123');
 *
 * return (
 *   <div>
 *     <p>Notifications: {userSettings?.notificationsEnabled ? 'On' : 'Off'}</p>
 *     <p>Theme: {userSettings?.theme}</p>
 *   </div>
 * );
 * ```
 */
export function useUserSettings(
  userId: string,
  options: UseSettingsOptions = {},
): UseQueryResult<AdminSettings, Error> {
  const {
    enabled = !!userId,
    staleTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  return useQuery<AdminSettings, Error>({
    queryKey: queryKeys.settings.user(userId),
    queryFn: () => fetchUserSettings(userId),
    enabled,
    staleTime,
    retry: 2,
  });
}

/**
 * Hook to fetch theme setting
 * Optimized for quick access to theme preference
 */
export function useThemeSetting(
  options: UseSettingsOptions = {},
): UseQueryResult<AdminSettings['theme'], Error> {
  const {
    enabled = true,
    staleTime = 1 * 60 * 60 * 1000, // 1 hour - theme rarely changes
  } = options;

  return useQuery<AdminSettings['theme'], Error>({
    queryKey: queryKeys.settings.theme(),
    queryFn: async () => {
      const settings = await fetchGlobalSettings();
      return settings.theme;
    },
    enabled,
    staleTime,
    retry: 1,
  });
}

/**
 * Hook to fetch notification settings
 */
export function useNotificationSettings(
  options: UseSettingsOptions = {},
): UseQueryResult<Pick<AdminSettings, 'notificationsEnabled' | 'emailNotifications' | 'pushNotifications'>, Error> {
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  return useQuery<
    Pick<AdminSettings, 'notificationsEnabled' | 'emailNotifications' | 'pushNotifications'>,
    Error
  >({
    queryKey: queryKeys.settings.notifications(),
    queryFn: async () => {
      const settings = await fetchGlobalSettings();
      return {
        notificationsEnabled: settings.notificationsEnabled,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
      };
    },
    enabled,
    staleTime,
    retry: 1,
  });
}
