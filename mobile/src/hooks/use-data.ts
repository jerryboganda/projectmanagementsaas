import { useQuery } from '@tanstack/react-query';
import { api, type ListProjectsParams, type ListTasksParams } from '../api/client';
import { getActiveWorkspaceId } from '../auth/token-store';

/**
 * TanStack Query hooks for mobile data surfaces.
 *
 * Query keys are workspace-scoped so switching workspaces
 * does not leak cross-tenant data through the cache.
 */

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: ({ signal }) => api.users.me(signal),
  });
}

export function useProjects(params: ListProjectsParams = {}) {
  const workspaceId = getActiveWorkspaceId();
  return useQuery({
    queryKey: ['projects', workspaceId, params],
    queryFn: ({ signal }) => api.projects.list(params, signal),
    enabled: !!workspaceId,
  });
}

export function useProject(id: string | undefined) {
  const workspaceId = getActiveWorkspaceId();
  return useQuery({
    queryKey: ['projects', workspaceId, 'detail', id],
    queryFn: ({ signal }) => api.projects.get(id!, signal),
    enabled: !!workspaceId && !!id,
  });
}

export function useTasks(params: ListTasksParams = {}) {
  const workspaceId = getActiveWorkspaceId();
  return useQuery({
    queryKey: ['tasks', workspaceId, params],
    queryFn: ({ signal }) => api.tasks.list(params, signal),
    enabled: !!workspaceId,
  });
}

export function useNotifications(params: { isRead?: boolean; isArchived?: boolean; pageSize?: number } = {}) {
  const workspaceId = getActiveWorkspaceId();
  return useQuery({
    queryKey: ['notifications', workspaceId, params],
    queryFn: ({ signal }) => api.notifications.list(params, signal),
    enabled: !!workspaceId,
    staleTime: 10_000,
  });
}

export function useSearch(q: string) {
  const workspaceId = getActiveWorkspaceId();
  const trimmed = q.trim();
  return useQuery({
    queryKey: ['search', workspaceId, trimmed],
    queryFn: ({ signal }) => api.search.query(trimmed, signal),
    enabled: !!workspaceId && trimmed.length >= 2,
  });
}

export function useCalendar(start: string, end: string) {
  const workspaceId = getActiveWorkspaceId();
  return useQuery({
    queryKey: ['calendar', workspaceId, start, end],
    queryFn: ({ signal }) => api.calendar.list({ start, end }, signal),
    enabled: !!workspaceId && !!start && !!end,
  });
}

export function useGoals(params: { status?: string; ownerId?: string; pageSize?: number } = {}) {
  const workspaceId = getActiveWorkspaceId();
  return useQuery({
    queryKey: ['goals', workspaceId, params],
    queryFn: ({ signal }) => api.goals.list(params, signal),
    enabled: !!workspaceId,
  });
}

export function useDocuments(params: { projectId?: string; pageSize?: number } = {}) {
  const workspaceId = getActiveWorkspaceId();
  return useQuery({
    queryKey: ['documents', workspaceId, params],
    queryFn: ({ signal }) => api.documents.list(params, signal),
    enabled: !!workspaceId,
  });
}

export function useSprintsForProject(projectId: string | undefined) {
  const workspaceId = getActiveWorkspaceId();
  return useQuery({
    queryKey: ['sprints', workspaceId, 'project', projectId],
    queryFn: ({ signal }) => api.sprints.listForProject(projectId!, signal),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useVelocity(params: { projectId?: string; sprintCount?: number } = {}) {
  const workspaceId = getActiveWorkspaceId();
  return useQuery({
    queryKey: ['velocity', workspaceId, params],
    queryFn: ({ signal }) => api.analytics.velocity(params, signal),
    enabled: !!workspaceId,
  });
}

export function useWorkload() {
  const workspaceId = getActiveWorkspaceId();
  return useQuery({
    queryKey: ['workload', workspaceId],
    queryFn: ({ signal }) => api.analytics.workload(signal),
    enabled: !!workspaceId,
  });
}

export function useTimeEntries(params: { userId?: string; taskId?: string; projectId?: string; startedAfter?: string; startedBefore?: string; isBillable?: boolean } = {}) {
  const workspaceId = getActiveWorkspaceId();
  return useQuery({
    queryKey: ['time-entries', workspaceId, params],
    queryFn: ({ signal }) => api.timeEntries.list(params, signal),
    enabled: !!workspaceId,
  });
}

export function useAutomations(params: { isEnabled?: boolean; projectId?: string; pageSize?: number } = {}) {
  const workspaceId = getActiveWorkspaceId();
  return useQuery({
    queryKey: ['automations', workspaceId, params],
    queryFn: ({ signal }) => api.automations.list(params, signal),
    enabled: !!workspaceId,
  });
}

export function useProjectTemplates() {
  return useQuery({
    queryKey: ['project-templates'],
    queryFn: ({ signal }) => api.projectTemplates.list(signal),
    staleTime: 10 * 60_000,
  });
}
