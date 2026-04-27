"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type {
  ProjectResponse,
  SprintResponse,
  TaskResponse,
  TaskStatus,
  TaskPriority,
  UpdateSprintRequest,
} from "@/lib/api/contracts";

export interface TimelineUpdateInput {
  title?: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
}

export interface TimelineCreateTaskInput {
  projectId: string;
  title: string;
  description?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority | null;
  assigneeId?: string | null;
}
import {
  buildTimelineAssignee,
  calculateProjectProgress,
  calculateSprintProgress,
  calculateTaskProgress,
  isBeforeToday,
  mergeTimelineAssignees,
  normalizeTimelinePriority,
  normalizeTimelineStatusFromProject,
  normalizeTimelineStatusFromSprint,
  normalizeTimelineStatusFromTask,
  sortTimelineItems,
  toTimelineDateKey,
  TIMELINE_STATUS_OPTIONS,
  type TimelineItem,
} from "@/components/timeline/data";

function resolveTaskRange(task: TaskResponse, sprint: SprintResponse | undefined) {
  const start = task.startDate ?? sprint?.startDate ?? task.createdAt;
  const end = task.dueDate ?? task.completedAt ?? sprint?.endDate ?? start;
  const normalizedStart = toTimelineDateKey(start);
  const normalizedEnd = toTimelineDateKey(end);

  return {
    startDate: normalizedStart,
    endDate: normalizedEnd < normalizedStart ? normalizedStart : normalizedEnd,
  };
}

function resolveProjectRange(project: ProjectResponse, tasks: TaskResponse[], sprints: SprintResponse[]) {
  const rangeCandidates = [
    project.startDate ? toTimelineDateKey(project.startDate) : null,
    ...tasks.flatMap((task) => [
      task.startDate ? toTimelineDateKey(task.startDate) : null,
      task.dueDate ? toTimelineDateKey(task.dueDate) : null,
      task.completedAt ? toTimelineDateKey(task.completedAt) : null,
      toTimelineDateKey(task.createdAt),
    ]),
    ...sprints.flatMap((sprint) => [toTimelineDateKey(sprint.startDate), toTimelineDateKey(sprint.endDate)]),
    toTimelineDateKey(project.createdAt),
    project.targetDate ? toTimelineDateKey(project.targetDate) : null,
  ].filter((value): value is string => !!value);

  const sorted = [...rangeCandidates].sort();
  const startDate = sorted[0] ?? toTimelineDateKey(project.createdAt);
  const endDate = sorted[sorted.length - 1] ?? startDate;

  return {
    startDate,
    endDate: endDate < startDate ? startDate : endDate,
  };
}

function resolveSprintRange(sprint: SprintResponse) {
  const startDate = toTimelineDateKey(sprint.startDate);
  const endDate = toTimelineDateKey(sprint.endDate);
  return {
    startDate,
    endDate: endDate < startDate ? startDate : endDate,
  };
}

function resolveProjectAssignee(project: ProjectResponse, tasks: TaskResponse[]) {
  if (project.lead) {
    return buildTimelineAssignee(project.lead.fullName, project.lead.avatarUrl);
  }

  const firstAssignee = tasks.find((task) => task.assignee)?.assignee;
  if (firstAssignee) {
    return buildTimelineAssignee(firstAssignee.fullName, firstAssignee.avatarUrl);
  }

  return undefined;
}

function resolveSprintAssignee(project: ProjectResponse, tasks: TaskResponse[]) {
  if (project.lead) {
    return buildTimelineAssignee(project.lead.fullName, project.lead.avatarUrl);
  }

  const firstAssignee = tasks.find((task) => task.assignee)?.assignee;
  if (firstAssignee) {
    return buildTimelineAssignee(firstAssignee.fullName, firstAssignee.avatarUrl);
  }

  return undefined;
}

function resolveTaskAssignee(task: TaskResponse) {
  if (!task.assignee) {
    return undefined;
  }

  return buildTimelineAssignee(task.assignee.fullName, task.assignee.avatarUrl);
}

function buildTaskTimelineItem(
  task: TaskResponse,
  project: ProjectResponse,
  sprint: SprintResponse | undefined,
): TimelineItem {
  const range = resolveTaskRange(task, sprint);
  const status = normalizeTimelineStatusFromTask(
    task.status,
    isBeforeToday(range.endDate) && !task.completedAt,
  );

  return {
    id: `task:${task.id}`,
    sourceType: "task",
    sourceId: task.id,
    title: task.title,
    description: task.description ?? undefined,
    projectId: project.id,
    projectName: project.name,
    projectIdentifier: project.identifier,
    status,
    priority: normalizeTimelinePriority(task.priority),
    assignee: resolveTaskAssignee(task),
    startDate: range.startDate,
    endDate: range.endDate,
    progress: calculateTaskProgress(task, status),
    sprintId: task.sprintId ?? undefined,
    sprintName: sprint?.name,
    sprintGoal: sprint?.goal ?? undefined,
    notes: task.taskType ?? undefined,
    rawStatusLabel: String(task.status),
  };
}

function buildProjectTimelineItem(
  project: ProjectResponse,
  tasks: TaskResponse[],
  sprints: SprintResponse[],
): TimelineItem {
  const range = resolveProjectRange(project, tasks, sprints);
  const status = normalizeTimelineStatusFromProject(
    project.status,
    isBeforeToday(range.endDate) && project.completedTaskCount < project.taskCount,
  );

  return {
    id: `project:${project.id}`,
    sourceType: "project",
    sourceId: project.id,
    title: project.name,
    description: project.description ?? undefined,
    projectId: project.id,
    projectName: project.name,
    projectIdentifier: project.identifier,
    status,
    priority: "None",
    assignee: resolveProjectAssignee(project, tasks),
    startDate: range.startDate,
    endDate: range.endDate,
    progress: calculateProjectProgress(project),
    taskCount: project.taskCount,
    completedTaskCount: project.completedTaskCount,
    notes: project.lead ? `Led by ${project.lead.fullName}` : undefined,
    rawStatusLabel: String(project.status),
  };
}

function buildSprintTimelineItem(
  sprint: SprintResponse,
  project: ProjectResponse,
  tasks: TaskResponse[],
): TimelineItem {
  const range = resolveSprintRange(sprint);
  const status = normalizeTimelineStatusFromSprint(
    sprint.status,
    isBeforeToday(range.endDate) && (sprint.completedPoints ?? 0) < (sprint.plannedPoints ?? 0),
  );

  return {
    id: `sprint:${sprint.id}`,
    sourceType: "sprint",
    sourceId: sprint.id,
    title: sprint.name,
    description: sprint.goal ?? undefined,
    projectId: project.id,
    projectName: project.name,
    projectIdentifier: project.identifier,
    status,
    priority: "None",
    assignee: resolveSprintAssignee(project, tasks),
    startDate: range.startDate,
    endDate: range.endDate,
    progress: calculateSprintProgress(sprint),
    taskCount: sprint.taskCount,
    completedTaskCount: sprint.completedTaskCount,
    plannedPoints: sprint.plannedPoints ?? null,
    completedPoints: sprint.completedPoints ?? null,
    sprintId: sprint.id,
    sprintName: sprint.name,
    sprintGoal: sprint.goal ?? undefined,
    notes: sprint.goal ?? undefined,
    rawStatusLabel: String(sprint.status),
  };
}

function timelineTasksQueryKey(workspaceId: string | null) {
  return ["timeline", workspaceId, "tasks"] as const;
}

function timelineProjectsQueryKey(workspaceId: string | null) {
  return ["timeline", workspaceId, "projects"] as const;
}

function timelineSprintsQueryKey(workspaceId: string | null, projectIds: readonly string[]) {
  return ["timeline", workspaceId, "sprints", projectIds] as const;
}

const TIMELINE_TASK_PAGE_SIZE = 100;
const TIMELINE_TASK_MAX_PAGES = 5;

export function useTimelineData() {
  const { apiClient, session } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const projectsQuery = useQuery<ProjectResponse[]>({
    queryKey: ["timeline", activeWorkspaceId, "projects"],
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () =>
      apiClient.listProjects({
        page: 1,
        pageSize: 100,
        sortBy: "updatedAt",
        sortOrder: "desc",
      }),
  });

  const tasksQuery = useQuery<TaskResponse[]>({
    queryKey: ["timeline", activeWorkspaceId, "tasks"],
    enabled: !!activeWorkspaceId,
    staleTime: 15_000,
    queryFn: async () => {
      const taskPages: TaskResponse[][] = [];

      for (let page = 1; page <= TIMELINE_TASK_MAX_PAGES; page += 1) {
        const pageTasks = await apiClient.listTasks({
          page,
          pageSize: TIMELINE_TASK_PAGE_SIZE,
          sortBy: "updatedAt",
          sortOrder: "desc",
        });

        taskPages.push(pageTasks);

        if (pageTasks.length < TIMELINE_TASK_PAGE_SIZE) {
          break;
        }
      }

      return taskPages.flat();
    },
  });

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const projectIds = useMemo(() => projects.map((project) => project.id).sort(), [projects]);
  const shouldLoadSprints = !!activeWorkspaceId && projectsQuery.isSuccess && projectIds.length > 0;

  const sprintsQuery = useQuery<SprintResponse[]>({
    queryKey: timelineSprintsQueryKey(activeWorkspaceId, projectIds),
    enabled: shouldLoadSprints,
    staleTime: 15_000,
    queryFn: async () => apiClient.listSprintsBatch(projectIds),
  });

  const sprintsByProjectId = useMemo(() => {
    const map = new Map<string, SprintResponse[]>();

    for (const sprint of sprintsQuery.data ?? []) {
      const projectSprints = map.get(sprint.projectId) ?? [];
      projectSprints.push(sprint);
      map.set(sprint.projectId, projectSprints);
    }

    return map;
  }, [sprintsQuery.data]);

  const sprintLookup = useMemo(() => {
    const map = new Map<string, SprintResponse>();

    for (const sprintList of sprintsByProjectId.values()) {
      for (const sprint of sprintList) {
        map.set(sprint.id, sprint);
      }
    }

    return map;
  }, [sprintsByProjectId]);

  const projectLookup = useMemo(() => {
    return new Map(projects.map((project) => [project.id, project] as const));
  }, [projects]);

  const tasksByProjectId = useMemo(() => {
    const map = new Map<string, TaskResponse[]>();

    for (const task of tasks) {
      const projectTasks = map.get(task.projectId) ?? [];
      projectTasks.push(task);
      map.set(task.projectId, projectTasks);
    }

    return map;
  }, [tasks]);

  const tasksBySprintId = useMemo(() => {
    const map = new Map<string, TaskResponse[]>();

    for (const task of tasks) {
      if (!task.sprintId) continue;
      const sprintTasks = map.get(task.sprintId) ?? [];
      sprintTasks.push(task);
      map.set(task.sprintId, sprintTasks);
    }

    return map;
  }, [tasks]);

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    for (const project of projects) {
      const projectTasks = tasksByProjectId.get(project.id) ?? [];
      const projectSprints = sprintsByProjectId.get(project.id) ?? [];

      items.push(buildProjectTimelineItem(project, projectTasks, projectSprints));

      for (const sprint of projectSprints) {
        const sprintTasks = tasksBySprintId.get(sprint.id) ?? [];
        items.push(buildSprintTimelineItem(sprint, project, sprintTasks));
      }

      for (const task of projectTasks) {
        const sprint = task.sprintId ? sprintLookup.get(task.sprintId) : undefined;
        items.push(buildTaskTimelineItem(task, project, sprint));
      }
    }

    return sortTimelineItems(items);
  }, [projects, sprintLookup, sprintsByProjectId, tasksByProjectId, tasksBySprintId]);

  const assigneeOptions = useMemo(() => {
    return mergeTimelineAssignees(timelineItems);
  }, [timelineItems]);

  const coreError = projectsQuery.error ?? tasksQuery.error ?? null;
  const sprintError = sprintsQuery.error instanceof Error ? sprintsQuery.error : null;

  const warning =
    !coreError && sprintError
      ? {
          message:
            "Some sprint data could not be loaded. The timeline is still showing live tasks and projects.",
        }
      : null;

  const isLoading =
    !activeWorkspaceId ||
    projectsQuery.isLoading ||
    tasksQuery.isLoading ||
    (shouldLoadSprints && sprintsQuery.isLoading);

  const isFetching =
    projectsQuery.isFetching ||
    tasksQuery.isFetching ||
    sprintsQuery.isFetching;

  const refreshTimeline = async () => {
    await Promise.all([
      projectsQuery.refetch(),
      tasksQuery.refetch(),
      ...(shouldLoadSprints ? [sprintsQuery.refetch()] : []),
    ]);
  };

  // ─── Mutations ────────────────────────────────────────────────────────────

  const updateTimelineItemMutation = useMutation({
    mutationFn: async ({
      item,
      updates,
    }: {
      item: { id: string; sourceType: string; sourceId: string; projectId: string; title: string; status: string; priority: string; description?: string; sprintId?: string; sprintName?: string; assignee?: { id: string } | null; startDate: string; endDate: string };
      updates: TimelineUpdateInput;
    }) => {
      if (item.sourceType === "task") {
        // For tasks we need to do a full PUT, so build the request from existing item + updates
        const normalizedStatus = (() => {
          const s = updates.status ?? item.status;
          switch (s) {
            case "completed": return "Done" as TaskStatus;
            case "in-progress": return "InProgress" as TaskStatus;
            case "cancelled": return "Cancelled" as TaskStatus;
            default: return "Todo" as TaskStatus;
          }
        })();
        const normalizedPriority = (updates.priority ?? item.priority) as TaskPriority;
        return apiClient.updateTask(item.sourceId, {
          title: updates.title ?? item.title,
          description: updates.description !== undefined ? updates.description : (item.description ?? null),
          status: normalizedStatus,
          priority: normalizedPriority,
          startDate: updates.startDate !== undefined ? updates.startDate : null,
          dueDate: updates.endDate !== undefined ? updates.endDate : null,
          assigneeId: updates.assigneeId !== undefined ? updates.assigneeId : (item.assignee?.id ?? null),
          sprintId: item.sprintId ?? null,
        });
      }
      if (item.sourceType === "sprint") {
        // Find sprint from lookup to get the name
        const sprint = sprintLookup.get(item.sourceId);
        const sprintReq: UpdateSprintRequest = {
          name: updates.title ?? item.title,
          goal: (sprint?.goal ?? null),
          startDate: updates.startDate ?? item.startDate,
          endDate: updates.endDate ?? item.endDate,
        };
        return apiClient.updateSprint(item.sourceId, sprintReq);
      }
      // projects — use updateProject with full required fields from lookup
      const existingProject = projectLookup.get(item.sourceId);
      if (!existingProject) {
        throw new Error("Project not found in local cache; refresh and try again.");
      }
      return apiClient.updateProject(item.sourceId, {
        name: updates.title ?? item.title,
        identifier: existingProject.identifier,
        description: existingProject.description ?? null,
        color: existingProject.color ?? null,
        status: existingProject.status,
        visibility: existingProject.visibility,
        startDate: updates.startDate ?? existingProject.startDate ?? null,
        targetDate: updates.endDate ?? existingProject.targetDate ?? null,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: timelineTasksQueryKey(activeWorkspaceId) }),
        queryClient.invalidateQueries({ queryKey: timelineProjectsQueryKey(activeWorkspaceId) }),
        queryClient.invalidateQueries({ queryKey: timelineSprintsQueryKey(activeWorkspaceId, projectIds) }),
      ]);
    },
  });

  const createTimelineTaskMutation = useMutation({
    mutationFn: async (input: TimelineCreateTaskInput) => {
      return apiClient.createTask({
        projectId: input.projectId,
        title: input.title,
        description: input.description ?? null,
        startDate: input.startDate ?? null,
        dueDate: input.dueDate ?? null,
        priority: input.priority ?? null,
        assigneeId: input.assigneeId ?? null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: timelineTasksQueryKey(activeWorkspaceId) });
    },
  });

  const selectedWorkspace =
    session?.workspaces.find((workspace) => workspace.workspaceId === activeWorkspaceId) ?? null;

  return {
    activeWorkspaceId,
    selectedWorkspace,
    projectsQuery,
    tasksQuery,
    sprintQueries: shouldLoadSprints ? [sprintsQuery] : [],
    timelineItems,
    assigneeOptions,
    statusOptions: TIMELINE_STATUS_OPTIONS,
    warning,
    error: coreError,
    isLoading,
    isFetching,
    refreshTimeline,
    projectLookup,
    sprintLookup,
    projects,
    hasLiveData: projects.length > 0 || tasks.length > 0,
    liveCounts: {
      projects: projects.length,
      tasks: tasks.length,
      sprints: [...sprintsByProjectId.values()].reduce((count, sprintList) => count + sprintList.length, 0),
    },
    updateTimelineItem: async (
      item: Parameters<typeof updateTimelineItemMutation.mutateAsync>[0]["item"],
      updates: TimelineUpdateInput,
    ) => updateTimelineItemMutation.mutateAsync({ item, updates }),
    createTimelineTask: async (input: TimelineCreateTaskInput) =>
      createTimelineTaskMutation.mutateAsync(input),
    isSavingTimelineItem: updateTimelineItemMutation.isPending,
    isCreatingTimelineTask: createTimelineTaskMutation.isPending,
  };
}
