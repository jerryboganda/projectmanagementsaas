"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import {
  type AutomationLogResponse,
  type AutomationProjectOption,
  type AutomationRuleResponse,
  type AutomationSurfaceItem,
  type AutomationSurfaceLog,
  type AutomationUpsertInput,
  toAutomationSurfaceItem,
  toAutomationSurfaceLog,
} from "@/lib/automations/types";

function automationQueryKey(workspaceId: string | null) {
  return ["automations", workspaceId] as const;
}

function automationLogsQueryKey(workspaceId: string | null, automationId: string | null) {
  return ["automations", workspaceId, automationId, "logs"] as const;
}

function projectsQueryKey(workspaceId: string | null) {
  return ["projects", workspaceId] as const;
}

function withQuery(
  path: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function replaceAutomation(
  current: AutomationSurfaceItem[] | undefined,
  updated: AutomationSurfaceItem,
) {
  if (!current) {
    return [updated];
  }

  const exists = current.some((item) => item.id === updated.id);
  return exists
    ? current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
    : [updated, ...current];
}

export function useAutomationsData(selectedAutomationId: string | null) {
  const { apiClient, session } = useAuth();
  const queryClient = useQueryClient();
  const activeWorkspaceId = session?.activeWorkspaceId ?? null;

  const automationsQuery = useQuery<AutomationSurfaceItem[]>({
    queryKey: automationQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 15_000,
    queryFn: async () => {
      const rules = await apiClient.request<AutomationRuleResponse[]>(
        withQuery("/api/v1/automations", { pageSize: 100 }),
      );

      return rules.map(toAutomationSurfaceItem);
    },
  });

  const projectsQuery = useQuery<AutomationProjectOption[]>({
    queryKey: projectsQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const projects = await apiClient.listProjects({
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      });

      return projects.map((project) => ({
        id: project.id,
        name: project.name,
      }));
    },
  });

  const selectedAutomation =
    automationsQuery.data?.find((automation) => automation.id === selectedAutomationId) ?? null;

  const automationLogsQuery = useQuery<AutomationSurfaceLog[]>({
    queryKey: automationLogsQueryKey(activeWorkspaceId, selectedAutomationId),
    enabled: !!activeWorkspaceId && !!selectedAutomationId,
    staleTime: 10_000,
    queryFn: async () => {
      const logs = await apiClient.request<AutomationLogResponse[]>(
        withQuery(`/api/v1/automations/${selectedAutomationId}/logs`, { pageSize: 10 }),
      );

      return logs.map(toAutomationSurfaceLog);
    },
  });

  const createAutomationMutation = useMutation({
    mutationFn: async (input: AutomationUpsertInput) => {
      return apiClient.request<AutomationRuleResponse>("/api/v1/automations", {
        method: "POST",
        body: input,
      });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: automationQueryKey(activeWorkspaceId) });

      const previousAutomations = queryClient.getQueryData<AutomationSurfaceItem[]>(
        automationQueryKey(activeWorkspaceId),
      );

      const tempId = `temp-${Date.now()}`;
      const optimisticAutomation = toAutomationSurfaceItem({
        id: tempId,
        name: input.name,
        description: input.description ?? "",
        isActive: input.isActive,
        trigger: input.trigger,
        action: input.action,
        projectId: input.projectId ?? null,
        executionCount: 0,
        lastExecutedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      queryClient.setQueryData<AutomationSurfaceItem[]>(
        automationQueryKey(activeWorkspaceId),
        (current) => [optimisticAutomation, ...(current ?? [])],
      );

      return { previousAutomations, tempId };
    },
    onError: (_error, _input, context) => {
      if (context?.previousAutomations) {
        queryClient.setQueryData(
          automationQueryKey(activeWorkspaceId),
          context.previousAutomations,
        );
      }
    },
    onSuccess: (createdAutomation, _input, context) => {
      const mappedAutomation = toAutomationSurfaceItem(createdAutomation);

      queryClient.setQueryData<AutomationSurfaceItem[]>(
        automationQueryKey(activeWorkspaceId),
        (current) =>
          [
            mappedAutomation,
            ...(current?.filter(
              (automation) =>
                automation.id !== mappedAutomation.id && automation.id !== context?.tempId,
            ) ?? []),
          ],
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: automationQueryKey(activeWorkspaceId) });
    },
  });

  const updateAutomationMutation = useMutation({
    mutationFn: async ({
      automationId,
      input,
    }: {
      automationId: string;
      input: AutomationUpsertInput;
    }) => {
      return apiClient.request<AutomationRuleResponse>(`/api/v1/automations/${automationId}`, {
        method: "PUT",
        body: input,
      });
    },
    onMutate: async ({ automationId, input }) => {
      await queryClient.cancelQueries({ queryKey: automationQueryKey(activeWorkspaceId) });
      await queryClient.cancelQueries({
        queryKey: automationLogsQueryKey(activeWorkspaceId, automationId),
      });

      const previousAutomations = queryClient.getQueryData<AutomationSurfaceItem[]>(
        automationQueryKey(activeWorkspaceId),
      );

      const optimisticAutomation = {
        id: automationId,
        name: input.name,
        description: input.description ?? "",
        enabled: input.isActive,
        trigger: input.trigger,
        action: input.action,
        projectId: input.projectId ?? null,
        executionCount:
          previousAutomations?.find((automation) => automation.id === automationId)
            ?.executionCount ?? 0,
        lastTriggered:
          previousAutomations?.find((automation) => automation.id === automationId)
            ?.lastTriggered ?? null,
        createdAt:
          previousAutomations?.find((automation) => automation.id === automationId)?.createdAt ??
          new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies AutomationSurfaceItem;

      queryClient.setQueryData<AutomationSurfaceItem[]>(
        automationQueryKey(activeWorkspaceId),
        (current) => replaceAutomation(current, optimisticAutomation),
      );

      return { previousAutomations };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousAutomations) {
        queryClient.setQueryData(
          automationQueryKey(activeWorkspaceId),
          context.previousAutomations,
        );
      }
    },
    onSuccess: (updatedAutomation) => {
      const mappedAutomation = toAutomationSurfaceItem(updatedAutomation);

      queryClient.setQueryData<AutomationSurfaceItem[]>(
        automationQueryKey(activeWorkspaceId),
        (current) => replaceAutomation(current, mappedAutomation),
      );
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({ queryKey: automationQueryKey(activeWorkspaceId) });
      await queryClient.invalidateQueries({
        queryKey: automationLogsQueryKey(activeWorkspaceId, variables?.automationId ?? null),
      });
    },
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: async ({
      automation,
      nextEnabled,
    }: {
      automation: AutomationSurfaceItem;
      nextEnabled: boolean;
    }) => {
      return apiClient.request<AutomationRuleResponse>(`/api/v1/automations/${automation.id}`, {
        method: "PUT",
        body: {
          name: automation.name,
          description: automation.description || null,
          isActive: nextEnabled,
          trigger: automation.trigger,
          action: automation.action,
          projectId: automation.projectId,
        } satisfies AutomationUpsertInput,
      });
    },
    onMutate: async ({ automation, nextEnabled }) => {
      await queryClient.cancelQueries({ queryKey: automationQueryKey(activeWorkspaceId) });

      const previousAutomations = queryClient.getQueryData<AutomationSurfaceItem[]>(
        automationQueryKey(activeWorkspaceId),
      );

      queryClient.setQueryData<AutomationSurfaceItem[]>(
        automationQueryKey(activeWorkspaceId),
        (current) =>
          current?.map((item) =>
            item.id === automation.id ? { ...item, enabled: nextEnabled } : item,
          ) ?? current,
      );

      return { previousAutomations };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousAutomations) {
        queryClient.setQueryData(
          automationQueryKey(activeWorkspaceId),
          context.previousAutomations,
        );
      }
    },
    onSuccess: (updatedAutomation) => {
      const mappedAutomation = toAutomationSurfaceItem(updatedAutomation);

      queryClient.setQueryData<AutomationSurfaceItem[]>(
        automationQueryKey(activeWorkspaceId),
        (current) => replaceAutomation(current, mappedAutomation),
      );
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({ queryKey: automationQueryKey(activeWorkspaceId) });
      await queryClient.invalidateQueries({
        queryKey: automationLogsQueryKey(activeWorkspaceId, variables?.automation.id ?? null),
      });
    },
  });

  const deleteAutomationMutation = useMutation({
    mutationFn: async (automationId: string) => {
      await apiClient.request<void>(`/api/v1/automations/${automationId}`, {
        method: "DELETE",
      });

      return automationId;
    },
    onMutate: async (automationId) => {
      await queryClient.cancelQueries({ queryKey: automationQueryKey(activeWorkspaceId) });

      const previousAutomations = queryClient.getQueryData<AutomationSurfaceItem[]>(
        automationQueryKey(activeWorkspaceId),
      );

      queryClient.setQueryData<AutomationSurfaceItem[]>(
        automationQueryKey(activeWorkspaceId),
        (current) => current?.filter((automation) => automation.id !== automationId) ?? current,
      );

      return { previousAutomations };
    },
    onError: (_error, _automationId, context) => {
      if (context?.previousAutomations) {
        queryClient.setQueryData(
          automationQueryKey(activeWorkspaceId),
          context.previousAutomations,
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: automationQueryKey(activeWorkspaceId) });
    },
  });

  return {
    activeWorkspaceId,
    automationsQuery,
    projectsQuery,
    automationLogsQuery,
    selectedAutomation,
    createAutomation: async (input: AutomationUpsertInput) =>
      createAutomationMutation.mutateAsync(input),
    updateAutomation: async (automationId: string, input: AutomationUpsertInput) =>
      updateAutomationMutation.mutateAsync({ automationId, input }),
    toggleAutomation: async (automation: AutomationSurfaceItem, nextEnabled: boolean) =>
      toggleAutomationMutation.mutateAsync({ automation, nextEnabled }),
    deleteAutomation: async (automationId: string) =>
      deleteAutomationMutation.mutateAsync(automationId),
    isCreatingAutomation: createAutomationMutation.isPending,
    isUpdatingAutomation: updateAutomationMutation.isPending,
    isTogglingAutomation: toggleAutomationMutation.isPending,
    isDeletingAutomation: deleteAutomationMutation.isPending,
  };
}
