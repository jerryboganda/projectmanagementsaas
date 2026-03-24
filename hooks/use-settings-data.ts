"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type {
  NotificationPreferenceItem,
  NotificationPreferenceResponse,
  UpdateProfileRequest,
  WorkspaceMemberResponse,
  WorkspaceRole,
  WorkspaceSettingsResponse,
} from "@/lib/api/contracts";

export interface SettingsNotificationPreference {
  eventType: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export interface GeneralSettingsInput {
  name: string;
  description: string;
  logoUrl: string;
  domain: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: string;
}

const NOTIFICATION_CATALOG = [
  {
    eventType: "mentions",
    label: "Mentions",
    description: "When someone @mentions you in workspace activity.",
    defaults: { inApp: true, email: true, push: true },
  },
  {
    eventType: "assignments",
    label: "Assignments",
    description: "When work is assigned to you.",
    defaults: { inApp: true, email: true, push: true },
  },
  {
    eventType: "statusChanges",
    label: "Status Changes",
    description: "When tracked work changes status.",
    defaults: { inApp: true, email: true, push: false },
  },
  {
    eventType: "comments",
    label: "Comments",
    description: "When someone comments on work you are involved in.",
    defaults: { inApp: true, email: true, push: true },
  },
  {
    eventType: "dueDates",
    label: "Due Dates",
    description: "When work you follow is due soon or overdue.",
    defaults: { inApp: true, email: false, push: false },
  },
];

function settingsQueryKey(workspaceId: string | null) {
  return ["settings", workspaceId, "workspace"] as const;
}

function membersQueryKey(workspaceId: string | null) {
  return ["settings", workspaceId, "members"] as const;
}

function profileQueryKey() {
  return ["settings", "profile"] as const;
}

function notificationPreferencesQueryKey() {
  return ["settings", "notification-preferences"] as const;
}

function normalizeWorkspaceRole(role: WorkspaceRole | null | undefined) {
  if (role === 0 || role === "Owner") return "Owner";
  if (role === 1 || role === "Admin") return "Admin";
  if (role === 2 || role === "Member") return "Member";
  if (role === 3 || role === "Guest") return "Guest";
  return null;
}

function mergeNotificationPreferences(
  preferences: NotificationPreferenceResponse[] | undefined,
): SettingsNotificationPreference[] {
  const byEventType = new Map((preferences ?? []).map((item) => [item.eventType, item]));

  return NOTIFICATION_CATALOG.map((item) => {
    const persisted = byEventType.get(item.eventType);

    return {
      eventType: item.eventType,
      label: item.label,
      description: item.description,
      inApp: persisted?.inApp ?? item.defaults.inApp,
      email: persisted?.email ?? item.defaults.email,
      push: persisted?.push ?? item.defaults.push,
    };
  });
}

function toWorkspaceSettingsInput(settings: WorkspaceSettingsResponse): GeneralSettingsInput {
  return {
    name: settings.name,
    description: settings.description ?? "",
    logoUrl: settings.logoUrl ?? "",
    domain: settings.domain ?? "",
    timezone: settings.timezone,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    weekStartsOn: settings.weekStartsOn,
  };
}

export function useSettingsData() {
  const { apiClient, refresh, session, status } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const isAuthenticated = status === "authenticated";

  const profileQuery = useQuery({
    queryKey: profileQueryKey(),
    enabled: isAuthenticated,
    staleTime: 30_000,
    queryFn: async () => apiClient.getCurrentUser(),
  });

  const workspaceSettingsQuery = useQuery({
    queryKey: settingsQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => apiClient.getWorkspaceSettings(activeWorkspaceId!),
  });

  const membersQuery = useQuery({
    queryKey: membersQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => apiClient.listWorkspaceMembers(activeWorkspaceId!),
  });

  const notificationPreferencesQuery = useQuery({
    queryKey: notificationPreferencesQueryKey(),
    enabled: isAuthenticated,
    staleTime: 30_000,
    queryFn: async () => apiClient.getNotificationPreferences(),
  });

  const saveWorkspaceMutation = useMutation({
    mutationFn: async (input: GeneralSettingsInput) => {
      if (!activeWorkspaceId) {
        throw new Error("An active workspace is required.");
      }

      await apiClient.updateWorkspace(activeWorkspaceId, {
        name: input.name,
        description: input.description || null,
        logoUrl: input.logoUrl || null,
        domain: input.domain || null,
      });

      await apiClient.updateWorkspaceSettings(activeWorkspaceId, {
        settings: {
          timezone: input.timezone,
          dateFormat: input.dateFormat,
          timeFormat: input.timeFormat,
          weekStartsOn: input.weekStartsOn,
        },
      });

      await refresh();
      return apiClient.getWorkspaceSettings(activeWorkspaceId);
    },
    onSuccess: async (workspaceSettings) => {
      queryClient.setQueryData(settingsQueryKey(activeWorkspaceId), workspaceSettings);
      await queryClient.invalidateQueries({
        queryKey: settingsQueryKey(activeWorkspaceId),
      });
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (input: UpdateProfileRequest) => {
      const user = await apiClient.updateCurrentUser(input);
      await refresh();
      return user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(profileQueryKey(), user);
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: WorkspaceMemberResponse["role"];
    }) => {
      if (!activeWorkspaceId) {
        throw new Error("An active workspace is required.");
      }

      return apiClient.updateWorkspaceMemberRole(activeWorkspaceId, userId, role);
    },
    onSuccess: (member) => {
      queryClient.setQueryData<WorkspaceMemberResponse[] | undefined>(
        membersQueryKey(activeWorkspaceId),
        (current) =>
          current?.map((item) => (item.userId === member.userId ? member : item)) ?? [member],
      );
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!activeWorkspaceId) {
        throw new Error("An active workspace is required.");
      }

      await apiClient.removeWorkspaceMember(activeWorkspaceId, userId);
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.setQueryData<WorkspaceMemberResponse[] | undefined>(
        membersQueryKey(activeWorkspaceId),
        (current) => current?.filter((item) => item.userId !== userId) ?? [],
      );
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async ({
      email,
      role,
    }: {
      email: string;
      role: WorkspaceMemberResponse["role"];
    }) => {
      if (!activeWorkspaceId) {
        throw new Error("An active workspace is required.");
      }

      return apiClient.inviteWorkspaceMember(activeWorkspaceId, {
        email,
        role,
        projectIds: null,
      });
    },
  });

  const saveNotificationPreferencesMutation = useMutation({
    mutationFn: async (preferences: NotificationPreferenceItem[]) =>
      apiClient.updateNotificationPreferences({ preferences }),
    onSuccess: (preferences) => {
      queryClient.setQueryData(notificationPreferencesQueryKey(), preferences);
    },
  });

  const workspaceRole = normalizeWorkspaceRole(
    workspaceSettingsQuery.data?.currentUserRole ?? null,
  );

  const mergedNotificationPreferences = useMemo(
    () => mergeNotificationPreferences(notificationPreferencesQuery.data),
    [notificationPreferencesQuery.data],
  );

  return {
    activeWorkspaceId,
    workspaceRole,
    session,
    workspaceSettingsQuery,
    membersQuery,
    profileQuery,
    notificationPreferencesQuery,
    workspaceSettingsInput: workspaceSettingsQuery.data
      ? toWorkspaceSettingsInput(workspaceSettingsQuery.data)
      : null,
    notificationPreferences: mergedNotificationPreferences,
    canManageWorkspace: workspaceRole === "Owner" || workspaceRole === "Admin",
    canManageMembers: workspaceRole === "Owner" || workspaceRole === "Admin",
    saveWorkspace: async (input: GeneralSettingsInput) =>
      saveWorkspaceMutation.mutateAsync(input),
    isSavingWorkspace: saveWorkspaceMutation.isPending,
    saveProfile: async (input: UpdateProfileRequest) =>
      saveProfileMutation.mutateAsync(input),
    isSavingProfile: saveProfileMutation.isPending,
    updateMemberRole: async (userId: string, role: WorkspaceMemberResponse["role"]) =>
      updateMemberRoleMutation.mutateAsync({ userId, role }),
    isUpdatingMemberRole: updateMemberRoleMutation.isPending,
    removeMember: async (userId: string) => removeMemberMutation.mutateAsync(userId),
    isRemovingMember: removeMemberMutation.isPending,
    inviteMember: async (email: string, role: WorkspaceMemberResponse["role"]) =>
      inviteMemberMutation.mutateAsync({ email, role }),
    isInvitingMember: inviteMemberMutation.isPending,
    saveNotificationPreferences: async (preferences: NotificationPreferenceItem[]) =>
      saveNotificationPreferencesMutation.mutateAsync(preferences),
    isSavingNotificationPreferences: saveNotificationPreferencesMutation.isPending,
  };
}
