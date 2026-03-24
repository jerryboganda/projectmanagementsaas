"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type {
  GoalResponse,
  ProjectResponse,
  WorkspaceMemberResponse,
} from "@/lib/api/contracts";
import {
  buildPortfolioGoalTree,
  findPortfolioGoalItem,
  flattenPortfolioGoalTree,
  toCreateGoalRequest,
  toCreateInitiativeRequest,
  toPortfolioGoalItem,
  toUpdateGoalRequest,
  toUpdateInitiativeRequest,
  type PortfolioGoalCreateInput,
  type PortfolioGoalItem,
  type PortfolioGoalUpdateInput,
  type PortfolioInitiativeCreateInput,
  type PortfolioInitiativeUpdateInput,
  type PortfolioSurfaceContext,
} from "@/lib/portfolio/types";

function portfolioQueryKey(workspaceId: string | null) {
  return ["portfolio", workspaceId] as const;
}

function portfolioGoalsListQueryKey(workspaceId: string | null) {
  return [...portfolioQueryKey(workspaceId), "goals"] as const;
}

function portfolioGoalDetailQueryKey(workspaceId: string | null, goalId: string | null) {
  return [...portfolioQueryKey(workspaceId), goalId, "detail"] as const;
}

function portfolioProjectsQueryKey(workspaceId: string | null) {
  return [...portfolioQueryKey(workspaceId), "projects"] as const;
}

function portfolioMembersQueryKey(workspaceId: string | null) {
  return [...portfolioQueryKey(workspaceId), "members"] as const;
}

function toSurfaceContext(
  projects: ProjectResponse[],
  members: WorkspaceMemberResponse[],
): PortfolioSurfaceContext {
  return {
    projectsById: new Map(projects.map((project) => [project.id, project])),
    membersByUserId: new Map(members.map((member) => [member.userId, member])),
  };
}

export function usePortfolioData(selectedGoalId: string | null) {
  const { apiClient, session } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const currentUser = session?.user ?? null;

  const goalsQuery = useQuery<GoalResponse[]>({
    queryKey: portfolioGoalsListQueryKey(activeWorkspaceId),
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
    queryKey: portfolioProjectsQueryKey(activeWorkspaceId),
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
    queryKey: portfolioMembersQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => apiClient.listWorkspaceMembers(activeWorkspaceId!),
  });

  const surfaceContext = useMemo(
    () => toSurfaceContext(projectsQuery.data ?? [], membersQuery.data ?? []),
    [membersQuery.data, projectsQuery.data],
  );

  const rootGoals = useMemo(
    () => buildPortfolioGoalTree(goalsQuery.data ?? [], surfaceContext),
    [goalsQuery.data, surfaceContext],
  );

  const flatGoals = useMemo(() => flattenPortfolioGoalTree(rootGoals), [rootGoals]);

  const selectedGoalFromTree = useMemo(
    () => findPortfolioGoalItem(rootGoals, selectedGoalId),
    [rootGoals, selectedGoalId],
  );

  const selectedGoalQuery = useQuery<PortfolioGoalItem>({
    queryKey: portfolioGoalDetailQueryKey(activeWorkspaceId, selectedGoalId),
    enabled:
      !!activeWorkspaceId &&
      !!selectedGoalId &&
      projectsQuery.isFetched &&
      membersQuery.isFetched,
    staleTime: 15_000,
    initialData: selectedGoalFromTree ?? undefined,
    queryFn: async () => {
      const detail = await apiClient.getGoal(selectedGoalId!);
      return toPortfolioGoalItem(detail, surfaceContext);
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (input: PortfolioGoalCreateInput) =>
      apiClient.createGoal(toCreateGoalRequest(input)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: portfolioQueryKey(activeWorkspaceId) });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, input }: { goalId: string; input: PortfolioGoalUpdateInput }) =>
      apiClient.updateGoal(goalId, toUpdateGoalRequest(input)),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: portfolioGoalDetailQueryKey(activeWorkspaceId, variables.goalId),
      });
      await queryClient.invalidateQueries({ queryKey: portfolioQueryKey(activeWorkspaceId) });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => apiClient.deleteGoal(goalId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: portfolioQueryKey(activeWorkspaceId) });
    },
  });

  const linkProjectMutation = useMutation({
    mutationFn: async ({ goalId, projectId }: { goalId: string; projectId: string }) =>
      apiClient.linkGoalProject(goalId, { projectId }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: portfolioGoalDetailQueryKey(activeWorkspaceId, variables.goalId),
      });
      await queryClient.invalidateQueries({ queryKey: portfolioQueryKey(activeWorkspaceId) });
    },
  });

  const createInitiativeMutation = useMutation({
    mutationFn: async ({
      goalId,
      input,
    }: {
      goalId: string;
      input: PortfolioInitiativeCreateInput;
    }) => apiClient.createGoalInitiative(goalId, toCreateInitiativeRequest(input)),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: portfolioGoalDetailQueryKey(activeWorkspaceId, variables.goalId),
      });
      await queryClient.invalidateQueries({ queryKey: portfolioQueryKey(activeWorkspaceId) });
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
      input: PortfolioInitiativeUpdateInput;
    }) => apiClient.updateGoalInitiative(goalId, initiativeId, toUpdateInitiativeRequest(input)),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: portfolioGoalDetailQueryKey(activeWorkspaceId, variables.goalId),
      });
      await queryClient.invalidateQueries({ queryKey: portfolioQueryKey(activeWorkspaceId) });
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
    createGoal: async (input: PortfolioGoalCreateInput) =>
      createGoalMutation.mutateAsync(input),
    updateGoal: async (goalId: string, input: PortfolioGoalUpdateInput) =>
      updateGoalMutation.mutateAsync({ goalId, input }),
    deleteGoal: async (goalId: string) => deleteGoalMutation.mutateAsync(goalId),
    linkProject: async (goalId: string, projectId: string) =>
      linkProjectMutation.mutateAsync({ goalId, projectId }),
    createInitiative: async (goalId: string, input: PortfolioInitiativeCreateInput) =>
      createInitiativeMutation.mutateAsync({ goalId, input }),
    updateInitiative: async (
      goalId: string,
      initiativeId: string,
      input: PortfolioInitiativeUpdateInput,
    ) => updateInitiativeMutation.mutateAsync({ goalId, initiativeId, input }),
    isSavingGoal: createGoalMutation.isPending || updateGoalMutation.isPending,
    isDeletingGoal: deleteGoalMutation.isPending,
    isLinkingGoalProject: linkProjectMutation.isPending,
    isCreatingInitiative: createInitiativeMutation.isPending,
    isUpdatingInitiative: updateInitiativeMutation.isPending,
  };
}
