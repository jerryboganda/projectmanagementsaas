"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type {
  CreateTeamRequest,
  SetTeamMembersRequest,
  TeamResponse,
  UpdateTeamRequest,
  WorkspaceMemberResponse,
} from "@/lib/api/contracts";

function teamsQueryKey(workspaceId: string | null) {
  return ["teams", workspaceId] as const;
}

export function teamsListQueryKey(workspaceId: string | null) {
  return [...teamsQueryKey(workspaceId), "list"] as const;
}

function workspaceMembersForTeamsKey(workspaceId: string | null) {
  return [...teamsQueryKey(workspaceId), "workspace-members"] as const;
}

export function useTeamsData() {
  const { apiClient } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const teamsQuery = useQuery({
    queryKey: teamsListQueryKey(activeWorkspaceId),
    queryFn: () => apiClient.listTeams(),
    enabled: !!activeWorkspaceId,
  });

  const workspaceMembersQuery = useQuery({
    queryKey: workspaceMembersForTeamsKey(activeWorkspaceId),
    queryFn: () => apiClient.listWorkspaceMembers(activeWorkspaceId!),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: teamsQueryKey(activeWorkspaceId) });

  const createTeamMutation = useMutation({
    mutationFn: (input: CreateTeamRequest) => apiClient.createTeam(input),
    onSuccess: () => invalidate(),
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ teamId, input }: { teamId: string; input: UpdateTeamRequest }) =>
      apiClient.updateTeam(teamId, input),
    onSuccess: () => invalidate(),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: string) => apiClient.deleteTeam(teamId),
    onSuccess: () => invalidate(),
  });

  const setTeamMembersMutation = useMutation({
    mutationFn: ({ teamId, input }: { teamId: string; input: SetTeamMembersRequest }) =>
      apiClient.setTeamMembers(teamId, input),
    onSuccess: () => invalidate(),
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      apiClient.addTeamMember(teamId, userId),
    onSuccess: () => invalidate(),
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      apiClient.removeTeamMember(teamId, userId),
    onSuccess: () => invalidate(),
  });

  return {
    teams: (teamsQuery.data ?? []) as TeamResponse[],
    workspaceMembers: (workspaceMembersQuery.data ?? []) as WorkspaceMemberResponse[],
    isLoading: teamsQuery.isLoading,
    isError: teamsQuery.isError,
    error: teamsQuery.error,
    refetch: teamsQuery.refetch,
    createTeam: createTeamMutation.mutateAsync,
    updateTeam: updateTeamMutation.mutateAsync,
    deleteTeam: deleteTeamMutation.mutateAsync,
    setTeamMembers: setTeamMembersMutation.mutateAsync,
    addTeamMember: addTeamMemberMutation.mutateAsync,
    removeTeamMember: removeTeamMemberMutation.mutateAsync,
    isMutating:
      createTeamMutation.isPending ||
      updateTeamMutation.isPending ||
      deleteTeamMutation.isPending ||
      setTeamMembersMutation.isPending ||
      addTeamMemberMutation.isPending ||
      removeTeamMemberMutation.isPending,
  };
}
