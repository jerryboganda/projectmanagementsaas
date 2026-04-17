"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  toProjectSurfaceItem,
  toUpdateProjectRequest,
  type ProjectSurfaceItem,
  type ProjectUpdateInput,
} from "@/lib/projects/types";

export function projectsListQueryKey(workspaceId: string | null) {
  return ["projects", workspaceId] as const;
}

export function projectDetailQueryKey(workspaceId: string | null, projectId: string | null) {
  return ["projects", workspaceId, projectId, "detail"] as const;
}

export function useProjectsData(selectedProjectId: string | null) {
  const { apiClient, session } = useAuth();
  const queryClient = useQueryClient();
  const activeWorkspaceId = session?.activeWorkspaceId ?? null;
  const fallbackOwnerName = session?.user.fullName ?? "Workspace member";

  const projectsQuery = useQuery<ProjectSurfaceItem[]>({
    queryKey: projectsListQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const projects = await apiClient.listProjects({
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      });

      return projects.map((project) => toProjectSurfaceItem(project, fallbackOwnerName));
    },
  });

  const selectedProjectFromList = useMemo(
    () => projectsQuery.data?.find((project) => project.id === selectedProjectId) ?? null,
    [projectsQuery.data, selectedProjectId],
  );

  const projectDetailQuery = useQuery<ProjectSurfaceItem>({
    queryKey: projectDetailQueryKey(activeWorkspaceId, selectedProjectId),
    enabled: !!activeWorkspaceId && !!selectedProjectId,
    staleTime: 30_000,
    initialData: selectedProjectFromList ?? undefined,
    queryFn: async () => {
      const detail = await apiClient.getProject(selectedProjectId!);
      return toProjectSurfaceItem(detail, fallbackOwnerName);
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (projectId: string) => apiClient.toggleProjectFavorite(projectId),
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({
        queryKey: projectsListQueryKey(activeWorkspaceId),
      });
      await queryClient.cancelQueries({
        queryKey: projectDetailQueryKey(activeWorkspaceId, projectId),
      });

      const previousProjects = queryClient.getQueryData<ProjectSurfaceItem[]>(
        projectsListQueryKey(activeWorkspaceId),
      );
      const previousDetail = queryClient.getQueryData<ProjectSurfaceItem>(
        projectDetailQueryKey(activeWorkspaceId, projectId),
      );

      const flipFavorite = (project: ProjectSurfaceItem) => ({
        ...project,
        isFavorite: !project.isFavorite,
      });

      if (previousProjects) {
        queryClient.setQueryData<ProjectSurfaceItem[]>(
          projectsListQueryKey(activeWorkspaceId),
          previousProjects.map((project) =>
            project.id === projectId ? flipFavorite(project) : project,
          ),
        );
      }

      if (previousDetail) {
        queryClient.setQueryData<ProjectSurfaceItem>(
          projectDetailQueryKey(activeWorkspaceId, projectId),
          flipFavorite(previousDetail),
        );
      }

      return { previousProjects, previousDetail };
    },
    onError: (_error, projectId, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(
          projectsListQueryKey(activeWorkspaceId),
          context.previousProjects,
        );
      }

      if (context?.previousDetail) {
        queryClient.setQueryData(
          projectDetailQueryKey(activeWorkspaceId, projectId),
          context.previousDetail,
        );
      }
    },
    onSettled: async (_data, _error, projectId) => {
      await queryClient.invalidateQueries({
        queryKey: projectsListQueryKey(activeWorkspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: projectDetailQueryKey(activeWorkspaceId, projectId),
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({
      projectId,
      updates,
    }: {
      projectId: string;
      updates: ProjectUpdateInput;
    }) => {
      const project =
        queryClient.getQueryData<ProjectSurfaceItem>(
          projectDetailQueryKey(activeWorkspaceId, projectId),
        ) ??
        queryClient
          .getQueryData<ProjectSurfaceItem[]>(projectsListQueryKey(activeWorkspaceId))
          ?.find((item) => item.id === projectId);

      if (!project) {
        throw new Error("Project data is not available yet.");
      }

      return apiClient.updateProject(projectId, toUpdateProjectRequest(project, updates));
    },
    onSuccess: async (updatedProject, variables) => {
      const mappedProject = toProjectSurfaceItem(updatedProject, fallbackOwnerName);

      queryClient.setQueryData<ProjectSurfaceItem[]>(
        projectsListQueryKey(activeWorkspaceId),
        (currentProjects) =>
          currentProjects
            ? currentProjects.map((project) =>
                project.id === mappedProject.id ? { ...project, ...mappedProject } : project,
              )
            : [mappedProject],
      );

      queryClient.setQueryData<ProjectSurfaceItem>(
        projectDetailQueryKey(activeWorkspaceId, variables.projectId),
        (currentProject) =>
          currentProject ? { ...currentProject, ...mappedProject } : mappedProject,
      );

      await queryClient.invalidateQueries({
        queryKey: projectDetailQueryKey(activeWorkspaceId, variables.projectId),
      });
    },
  });

  return {
    projectsQuery,
    projectDetailQuery,
    projects: projectsQuery.data ?? [],
    selectedProject: projectDetailQuery.data ?? selectedProjectFromList,
    toggleFavorite: async (projectId: string) => toggleFavoriteMutation.mutateAsync(projectId),
    updateProject: async (projectId: string, updates: ProjectUpdateInput) =>
      updateProjectMutation.mutateAsync({ projectId, updates }),
    isUpdatingProject: updateProjectMutation.isPending,
  };
}
