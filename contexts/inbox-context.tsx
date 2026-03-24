"use client";

import { type InboxItem, toInboxItem } from "@/components/inbox/data";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import React, { createContext, type ReactNode, useContext, useMemo } from "react";

interface InboxContextType {
  items: InboxItem[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archive: (id: string) => Promise<void>;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

function notificationsQueryKey(workspaceId: string | null): QueryKey {
  return ["notifications", "inbox", workspaceId];
}

function updateItems(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string | null,
  updater: (items: InboxItem[]) => InboxItem[],
) {
  queryClient.setQueryData<InboxItem[]>(notificationsQueryKey(workspaceId), (current = []) =>
    updater(current),
  );
}

export function InboxProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { apiClient, isAuthenticated, status } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const enabled = isAuthenticated && !!activeWorkspaceId;

  const query = useQuery({
    queryKey: notificationsQueryKey(activeWorkspaceId),
    enabled,
    queryFn: async () => {
      const notifications = await apiClient.listNotifications({
        isArchived: false,
        pageSize: 100,
      });

      return notifications.map(toInboxItem);
    },
    placeholderData: (previous) => previous,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => apiClient.markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey(activeWorkspaceId) });
      const previousItems =
        queryClient.getQueryData<InboxItem[]>(notificationsQueryKey(activeWorkspaceId)) ?? [];

      updateItems(queryClient, activeWorkspaceId, (items) =>
        items.map((item) => (item.id === id ? { ...item, unread: false } : item)),
      );

      return { previousItems };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(notificationsQueryKey(activeWorkspaceId), context?.previousItems);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey(activeWorkspaceId) });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => apiClient.markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey(activeWorkspaceId) });
      const previousItems =
        queryClient.getQueryData<InboxItem[]>(notificationsQueryKey(activeWorkspaceId)) ?? [];

      updateItems(queryClient, activeWorkspaceId, (items) =>
        items.map((item) => ({ ...item, unread: false })),
      );

      return { previousItems };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(notificationsQueryKey(activeWorkspaceId), context?.previousItems);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey(activeWorkspaceId) });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => apiClient.archiveNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey(activeWorkspaceId) });
      const previousItems =
        queryClient.getQueryData<InboxItem[]>(notificationsQueryKey(activeWorkspaceId)) ?? [];

      updateItems(queryClient, activeWorkspaceId, (items) =>
        items.filter((item) => item.id !== id),
      );

      return { previousItems };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(notificationsQueryKey(activeWorkspaceId), context?.previousItems);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey(activeWorkspaceId) });
    },
  });

  const items = useMemo(() => query.data ?? [], [query.data]);
  const unreadCount = items.filter((item) => item.unread).length;

  const value = useMemo<InboxContextType>(
    () => ({
      items,
      unreadCount,
      isLoading: status === "loading" || (enabled && query.isPending),
      isError: query.isError,
      refetch: async () => {
        const result = await query.refetch();
        return result.data;
      },
      markAsRead: async (id: string) => {
        await markAsReadMutation.mutateAsync(id);
      },
      markAllAsRead: async () => {
        if (unreadCount === 0) {
          return;
        }

        await markAllAsReadMutation.mutateAsync();
      },
      archive: async (id: string) => {
        await archiveMutation.mutateAsync(id);
      },
    }),
    [
      archiveMutation,
      enabled,
      items,
      markAllAsReadMutation,
      markAsReadMutation,
      query,
      status,
      unreadCount,
    ],
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox() {
  const context = useContext(InboxContext);
  if (context === undefined) {
    throw new Error("useInbox must be used within an InboxProvider");
  }

  return context;
}
