"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type {
  CreateGoalRequest,
  CreateInitiativeRequest,
  GoalResponse,
  ProjectResponse,
  UpdateGoalRequest,
  UpdateInitiativeRequest,
  WorkspaceMemberResponse,
} from "@/lib/api/contracts";
import {
  buildGoalSurfaceTree,
  findGoalSurfaceItem,
  flattenGoalSurfaceTree,
  goalStatusToApi,
  goalTypeToApi,
  initiativeStatusToApi,
  progressSourceToApi,
  toGoalSurfaceItem,
  type GoalCreateInput,
  type GoalInitiativeCreateInput,
  type GoalInitiativeUpdateInput,
  type GoalSurfaceContext,
  type GoalSurfaceItem,
  type GoalUpdateInput,
} from "@/components/goals/data";

function goalsQueryKey(workspaceId: string | null) {
  return ["goals", workspaceId] as const;
}

export function goalsListQueryKey(workspaceId: string | null) {
  return [...goalsQueryKey(workspaceId), "list"] as const;
}

export function goalDetailQueryKey(workspaceId: string | null, goalId: string | null) {
  return [...goalsQueryKey(workspaceId), goalId, "detail"] as const;
}

function goalsProjectsQueryKey(workspaceId: string | null) {
  return [...goalsQueryKey(workspaceId), "projects"] as const;
}

function goalsMembersQueryKey(workspaceId: string | null) {
  return [...goalsQueryKey(workspaceId), "members"] as const;
}

function toSurfaceContext(
  projects: ProjectResponse[],
  members: WorkspaceMemberResponse[],
): GoalSurfaceContext {
  return {
    projectsById: new Map(projects.map((project) => [project.id, project])),
    membersByUserId: new Map(members.map((member) => [member.userId, member])),
  };
}

function toCreateGoalRequest(input: GoalCreateInput): CreateGoalRequest {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: input.status ? goalStatusToApi(input.status) : null,
    type: input.type ? goalTypeToApi(input.type) : null,
    progressPercent: input.progressPercent ?? null,
    progressSource: input.progressSource ? progressSourceToApi(input.progressSource) : null,
    ownerId: input.ownerId ?? null,
    startDate: input.startDate ?? null,
    targetDate: input.targetDate ?? null,
    parentGoalId: input.parentGoalId ?? null,
  };
}

function toUpdateGoalRequest(input: GoalUpdateInput): UpdateGoalRequest {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: goalStatusToApi(input.status),
    type: goalTypeToApi(input.type),
    progressPercent: input.progressPercent ?? null,
    progressSource: input.progressSource ? progressSourceToApi(input.progressSource) : null,
    ownerId: input.ownerId ?? null,
    startDate: input.startDate ?? null,
    targetDate: input.targetDate ?? null,
    parentGoalId: input.parentGoalId ?? null,
  };
}

function toCreateInitiativeRequest(input: GoalInitiativeCreateInput): CreateInitiativeRequest {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: input.status ? initiativeStatusToApi(input.status) : null,
    ownerId: input.ownerId ?? null,
    startDate: input.startDate ?? null,
    targetDate: input.targetDate ?? null,
    progressPercent: input.progressPercent ?? null,
  };
}

function toUpdateInitiativeRequest(input: GoalInitiativeUpdateInput): UpdateInitiativeRequest {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: initiativeStatusToApi(input.status),
    ownerId: input.ownerId ?? null,
    startDate: input.startDate ?? null,
    targetDate: input.targetDate ?? null,
    progressPercent: input.progressPercent ?? null,
  };
}

export function useGoalsData(selectedGoalId: string | null) {
  const { apiClient, session } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const currentUser = session?.user ?? null;

  const goalsQuery = useQuery<GoalResponse[]>({
    queryKey: goalsListQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 15_000,
    queryFn: async () =>
      apiClient.listGoals({
        pageSize: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  const projectsQuery = useQuery<ProjectResponse[]>({
    queryKey: goalsProjectsQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () =>
      apiClient.listProjects({
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      }),
  });

  const membersQuery = useQuery<WorkspaceMemberResponse[]>({
    queryKey: goalsMembersQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => apiClient.listWorkspaceMembers(activeWorkspaceId!),
  });

  const surfaceContext = useMemo(
    () => toSurfaceContext(projectsQuery.data ?? [], membersQuery.data ?? []),
    [membersQuery.data, projectsQuery.data],
  );

  const rootGoals = useMemo(
    () => buildGoalSurfaceTree(goalsQuery.data ?? [], surfaceContext),
    [goalsQuery.data, surfaceContext],
  );

  const flatGoals = useMemo(() => flattenGoalSurfaceTree(rootGoals), [rootGoals]);

  const selectedGoalFromTree = useMemo(
    () => findGoalSurfaceItem(rootGoals, selectedGoalId),
    [rootGoals, selectedGoalId],
  );

  const selectedGoalQuery = useQuery<GoalSurfaceItem>({
    queryKey: goalDetailQueryKey(activeWorkspaceId, selectedGoalId),
    enabled: !!activeWorkspaceId && !!selectedGoalId,
    staleTime: 15_000,
    initialData: selectedGoalFromTree ?? undefined,
    queryFn: async () => {
      const detail = await apiClient.getGoal(selectedGoalId!);
      return toGoalSurfaceItem(detail, surfaceContext);
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (input: GoalCreateInput) => apiClient.createGoal(toCreateGoalRequest(input)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: goalsQueryKey(activeWorkspaceId) });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, input }: { goalId: string; input: GoalUpdateInput }) =>
      apiClient.updateGoal(goalId, toUpdateGoalRequest(input)),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: goalDetailQueryKey(activeWorkspaceId, variables.goalId),
      });
      await queryClient.invalidateQueries({ queryKey: goalsQueryKey(activeWorkspaceId) });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => apiClient.deleteGoal(goalId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: goalsQueryKey(activeWorkspaceId) });
    },
  });

  const linkProjectMutation = useMutation({
    mutationFn: async ({ goalId, projectId }: { goalId: string; projectId: string }) =>
      apiClient.linkGoalProject(goalId, { projectId }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: goalDetailQueryKey(activeWorkspaceId, variables.goalId),
      });
      await queryClient.invalidateQueries({ queryKey: goalsQueryKey(activeWorkspaceId) });
    },
  });

  const createInitiativeMutation = useMutation({
    mutationFn: async ({
      goalId,
      input,
    }: {
      goalId: string;
      input: GoalInitiativeCreateInput;
    }) => apiClient.createGoalInitiative(goalId, toCreateInitiativeRequest(input)),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: goalDetailQueryKey(activeWorkspaceId, variables.goalId),
      });
      await queryClient.invalidateQueries({ queryKey: goalsQueryKey(activeWorkspaceId) });
    },
  });

  const updateInitiativeMutation = useMutation({
    mutationFn: async ({
      goalId,
      initiativeId,
      input,
    }: {
      goalId: string;
      initiativeId: string;
      input: GoalInitiativeUpdateInput;
    }) => apiClient.updateGoalInitiative(goalId, initiativeId, toUpdateInitiativeRequest(input)),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: goalDetailQueryKey(activeWorkspaceId, variables.goalId),
      });
      await queryClient.invalidateQueries({ queryKey: goalsQueryKey(activeWorkspaceId) });
    },
  });

  const deleteInitiativeMutation = useMutation({
    mutationFn: async ({
      goalId,
      initiativeId,
    }: {
      goalId: string;
      initiativeId: string;
    }) => apiClient.deleteGoalInitiative(goalId, initiativeId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: goalDetailQueryKey(activeWorkspaceId, variables.goalId),
      });
      await queryClient.invalidateQueries({ queryKey: goalsQueryKey(activeWorkspaceId) });
    },
  });

  const unlinkProjectMutation = useMutation({
    mutationFn: async ({
      goalId,
      projectId,
    }: {
      goalId: string;
      projectId: string;
    }) => apiClient.unlinkGoalProject(goalId, projectId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: goalDetailQueryKey(activeWorkspaceId, variables.goalId),
      });
      await queryClient.invalidateQueries({ queryKey: goalsQueryKey(activeWorkspaceId) });
    },
  });

  const projects = useMemo(
    () =>
      (projectsQuery.data ?? []).map((project) => ({
        id: project.id,
        name: project.name,
        status: typeof project.status === "string" ? project.status : String(project.status),
      })),
    [projectsQuery.data],
  );

  const members = useMemo(
    () =>
      (membersQuery.data ?? []).map((member) => ({
        id: member.userId,
        fullName: member.fullName,
        avatarUrl: member.avatarUrl ?? null,
      })),
    [membersQuery.data],
  );

  return {
    goalsQuery,
    selectedGoalQuery,
    projectsQuery,
    membersQuery,
    rootGoals,
    goals: flatGoals,
    selectedGoal: selectedGoalQuery.data ?? selectedGoalFromTree ?? null,
    projects,
    members,
    currentUser,
    createGoal: async (input: GoalCreateInput) => createGoalMutation.mutateAsync(input),
    updateGoal: async (goalId: string, input: GoalUpdateInput) =>
      updateGoalMutation.mutateAsync({ goalId, input }),
    deleteGoal: async (goalId: string) => deleteGoalMutation.mutateAsync(goalId),
    linkProject: async (goalId: string, projectId: string) =>
      linkProjectMutation.mutateAsync({ goalId, projectId }),
    createInitiative: async (goalId: string, input: GoalInitiativeCreateInput) =>
      createInitiativeMutation.mutateAsync({ goalId, input }),
    updateInitiative: async (goalId: string, initiativeId: string, input: GoalInitiativeUpdateInput) =>
      updateInitiativeMutation.mutateAsync({ goalId, initiativeId, input }),
    deleteInitiative: async (goalId: string, initiativeId: string) =>
      deleteInitiativeMutation.mutateAsync({ goalId, initiativeId }),
    unlinkProject: async (goalId: string, projectId: string) =>
      unlinkProjectMutation.mutateAsync({ goalId, projectId }),
    isSavingGoal: createGoalMutation.isPending || updateGoalMutation.isPending,
    isDeletingGoal: deleteGoalMutation.isPending,
    isLinkingGoalProject: linkProjectMutation.isPending,
    isCreatingInitiative: createInitiativeMutation.isPending,
    isUpdatingInitiative: updateInitiativeMutation.isPending,
    isDeletingInitiative: deleteInitiativeMutation.isPending,
    isUnlinkingProject: unlinkProjectMutation.isPending,
  };
}
