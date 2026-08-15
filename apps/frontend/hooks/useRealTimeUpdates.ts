/**
 * Real-time Updates Hook
 * Prepares for WebSocket/Socket.io integration
 * Currently uses polling as fallback for real-time updates
 */

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/cache-keys';

/**
 * Entity types that support real-time updates
 */
export type RealtimeEntity = 'dashboard' | 'content' | 'users' | 'registrations' | 'bookings';

/**
 * Real-time update message
 */
export interface RealtimeMessage {
  entity: RealtimeEntity;
  action: 'create' | 'update' | 'delete';
  id?: string;
  data?: unknown;
  timestamp: number;
}

/**
 * Hook to handle real-time updates via polling
 * This prepares the foundation for Socket.io integration
 *
 * @param entity - Entity type to watch
 * @param pollInterval - Polling interval in milliseconds (0 to disable)
 * @param onUpdate - Callback when update received
 *
 * @example
 * ```typescript
 * useRealTimeUpdates('dashboard', 30000, (message) => {
 *   console.log('Dashboard updated:', message);
 * });
 *
 * // Or with Socket.io later:
 * // const socket = io('/admin');
 * // socket.on('dashboard:update', (data) => {
 * //   onUpdate({ entity: 'dashboard', action: 'update', data });
 * // });
 * ```
 */
export function useRealTimeUpdates(
  entity: RealtimeEntity,
  pollInterval: number = 30000,
  onUpdate?: (message: RealtimeMessage) => void,
): void {
  const queryClient = useQueryClient();

  // Set up polling for real-time updates (fallback until Socket.io is integrated)
  useEffect(() => {
    if (pollInterval === 0) return; // Disabled

    const interval = setInterval(() => {
      // Invalidate relevant cache to trigger refetch
      switch (entity) {
        case 'dashboard':
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.metrics() });
          break;
        case 'content':
          queryClient.invalidateQueries({ queryKey: queryKeys.content.lists() });
          break;
        case 'users':
          queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
          break;
        case 'registrations':
          queryClient.invalidateQueries({ queryKey: queryKeys.registrations.lists() });
          break;
        case 'bookings':
          queryClient.invalidateQueries({ queryKey: queryKeys.bookings.lists() });
          break;
      }

      // Call custom callback
      if (onUpdate) {
        onUpdate({
          entity,
          action: 'update',
          timestamp: Date.now(),
        });
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [entity, pollInterval, queryClient, onUpdate]);
}

/**
 * Hook to watch for specific entity updates
 *
 * @param entity - Entity type to watch
 * @param entityId - Optional entity ID to watch specific item
 * @param onUpdate - Callback when update received
 *
 * @example
 * ```typescript
 * const watchEntity = useWatchEntity('content', 'content-123', (message) => {
 *   if (message.action === 'delete') {
 *     // Content was deleted
 *     navigate('/admin/content');
 *   }
 * });
 * ```
 */
export function useWatchEntity(
  entity: RealtimeEntity,
  entityId?: string,
  onUpdate?: (message: RealtimeMessage) => void,
): void {
  useEffect(() => {
    // Listen for Socket.io events when integrated
    if (typeof window !== 'undefined' && 'io' in window) {
      // Socket.io would be set up here
      // const socket = (window as any).io('/admin');
      // socket.on(`${entity}:${entityId || 'all'}:update`, (data) => {
      //   onUpdate?.({ entity, action: 'update', id: entityId, data, timestamp: Date.now() });
      // });
    }
  }, [entity, entityId, onUpdate]);
}

/**
 * Hook to handle batch real-time updates
 * Useful when multiple entities might update together
 *
 * @param entities - Entity types to watch
 * @param onBatchUpdate - Callback when any entity updates
 *
 * @example
 * ```typescript
 * useBatchRealTimeUpdates(
 *   ['dashboard', 'users', 'content'],
 *   (updates) => {
 *     console.log('Multiple entities updated:', updates);
 *   }
 * );
 * ```
 */
export function useBatchRealTimeUpdates(
  entities: RealtimeEntity[],
  onBatchUpdate?: (messages: RealtimeMessage[]) => void,
): void {
  const queryClient = useQueryClient();
  const messageQueueRef = useCallback((): RealtimeMessage[] => {
    return [];
  }, []);

  useEffect(() => {
    const queue: RealtimeMessage[] = [];

    const handleUpdate = (message: RealtimeMessage) => {
      queue.push(message);

      // Batch updates - send every 100ms or when queue reaches 10 items
      if (queue.length >= 10) {
        if (onBatchUpdate) {
          onBatchUpdate([...queue]);
        }
        queue.length = 0;
      }
    };

    // Set up watchers for each entity
    entities.forEach((entity) => {
      useRealTimeUpdates(entity, 0, handleUpdate); // 0 = no polling, just watchers
    });

    // Flush queue periodically
    const flushInterval = setInterval(() => {
      if (queue.length > 0) {
        if (onBatchUpdate) {
          onBatchUpdate([...queue]);
        }
        queue.length = 0;
      }
    }, 100);

    return () => clearInterval(flushInterval);
  }, [entities, queryClient, onBatchUpdate]);
}

/**
 * Hook to simulate real-time updates in development
 * Useful for testing real-time features without running actual WebSocket server
 *
 * @param entity - Entity type
 * @param interval - Update interval in milliseconds
 *
 * @example
 * ```typescript
 * // In development, simulate dashboard updates every 30 seconds
 * useMockRealtimeUpdates('dashboard', 30000);
 * ```
 */
export function useMockRealtimeUpdates(entity: RealtimeEntity, interval: number = 30000): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    console.log(`[Mock RT] Starting mock real-time updates for ${entity}`);

    const timer = setInterval(() => {
      console.log(`[Mock RT] Updating ${entity}`);
      queryClient.invalidateQueries({ queryKey: [entity] });
    }, interval);

    return () => {
      clearInterval(timer);
      console.log(`[Mock RT] Stopped mock real-time updates for ${entity}`);
    };
  }, [entity, interval, queryClient]);
}
