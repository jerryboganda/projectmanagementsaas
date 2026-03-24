"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { projectsListQueryKey } from "@/hooks/use-projects-data";
import type {
  CreateProjectFromTemplateRequest,
  ProjectResponse,
  ProjectTemplateResponse,
} from "@/lib/api/contracts";
import { buildProjectIdentifier, type ProjectTemplate } from "@/lib/templates/types";

function templatesQueryKey(workspaceId: string | null) {
  return ["templates", workspaceId] as const;
}

export function useTemplatesData() {
  const { apiClient } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery<ProjectTemplateResponse[]>({
    queryKey: templatesQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => apiClient.listProjectTemplates(),
  });

  const templates = useMemo<ProjectTemplate[]>(
    () => templatesQuery.data ?? [],
    [templatesQuery.data],
  );

  const createProjectFromTemplateMutation = useMutation({
    mutationFn: async ({
      templateId,
      projectName,
    }: {
      templateId: string;
      projectName: string;
    }) => {
      const template = templates.find((item) => item.id === templateId);

      if (!template) {
        throw new Error("Template data is not available yet.");
      }

      const request: CreateProjectFromTemplateRequest = {
        templateId,
        name: projectName,
        identifier: buildProjectIdentifier(projectName),
        description: null,
        leadId: null,
        startDate: null,
        targetDate: null,
      };

      return apiClient.createProjectFromTemplate(request);
    },
    onSuccess: async (createdProject: ProjectResponse) => {
      await queryClient.invalidateQueries({
        queryKey: projectsListQueryKey(activeWorkspaceId),
      });

      return createdProject;
    },
  });

  return {
    templatesQuery,
    templates,
    isLoadingTemplates: templatesQuery.isLoading,
    isRefreshingTemplates: templatesQuery.isFetching,
    templatesError: templatesQuery.error,
    refreshTemplates: async () => {
      await templatesQuery.refetch();
    },
    createProjectFromTemplate: async (templateId: string, projectName: string) =>
      createProjectFromTemplateMutation.mutateAsync({ templateId, projectName }),
    isCreatingProjectFromTemplate: createProjectFromTemplateMutation.isPending,
    createProjectFromTemplateError: createProjectFromTemplateMutation.error,
  };
}
