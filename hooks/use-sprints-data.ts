"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type {
  CreateSprintRequest,
  ProjectResponse,
  SprintResponse,
  SprintTransitionResponse,
  TaskResponse,
  UpdateSprintRequest,
  UpdateTaskRequest,
} from "@/lib/api/contracts";
import {
  denormalizeTaskPriority,
  denormalizeTaskStatus,
  normalizeTaskPriority,
  normalizeTaskStatus,
  type BoardTaskPriority,
  type BoardTaskStatus,
} from "@/components/board/types";

type SprintStatus = "planning" | "active" | "completed" | "cancelled";

export interface SprintAssignee {
  id: string;
  name: string;
  initials: string;
}

export interface LiveSprintTask {
  id: string;
  identifier: string;
  title: string;
  description: string;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  type: string;
  assignee?: SprintAssignee;
  projectId: string;
  sprintId?: string;
  dueDate?: string;
  startDate?: string;
  tags: string[];
  sortOrder: number;
  rawStatus: TaskResponse["status"];
  rawPriority: TaskResponse["priority"];
  createdAt: string;
  updatedAt: string;
}

export interface LiveSprint {
  id: string;
  projectId: string;
  name: string;
  goalDescription?: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  plannedPoints?: number | null;
  completedPoints?: number | null;
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

function toInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function mapSprintStatus(status: SprintResponse["status"]): SprintStatus | null {
  if (status === "Planned" || status === 0) return "planning";
  if (status === "Active" || status === 1) return "active";
  if (status === "Completed" || status === 2) return "completed";
  if (status === "Cancelled" || status === 3) return "cancelled";
  return null;
}

function toLiveSprint(sprint: SprintResponse): LiveSprint | null {
  const status = mapSprintStatus(sprint.status);

  if (!status) {
    return null;
  }

  return {
    id: sprint.id,
    projectId: sprint.projectId,
    name: sprint.name,
    goalDescription: sprint.goal ?? undefined,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    status,
    plannedPoints: sprint.plannedPoints ?? null,
    completedPoints: sprint.completedPoints ?? null,
    taskCount: sprint.taskCount,
    completedTaskCount: sprint.completedTaskCount,
    createdAt: sprint.createdAt,
    updatedAt: sprint.updatedAt,
  };
}

function toLiveTask(task: TaskResponse): LiveSprintTask | null {
  const status = normalizeTaskStatus(task.status);

  if (!status) {
    return null;
  }

  return {
    id: task.id,
    identifier: task.identifier,
    title: task.title,
    description: task.description ?? "",
    status,
    priority: normalizeTaskPriority(task.priority),
    type: (task.taskType ?? "task") as string,
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.fullName,
          initials: toInitials(task.assignee.fullName),
        }
      : undefined,
    projectId: task.projectId,
    sprintId: task.sprintId ?? undefined,
    dueDate: task.dueDate ?? undefined,
    startDate: task.startDate ?? undefined,
    tags: task.labels,
    sortOrder: task.sortOrder,
    rawStatus: task.status,
    rawPriority: task.priority,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function toUpdateTaskRequest(task: LiveSprintTask, sprintId: string | null): UpdateTaskRequest {
  return {
    title: task.title,
    description: task.description || null,
    status: denormalizeTaskStatus(task.status),
    priority: denormalizeTaskPriority(task.priority),
    taskType: task.type,
    labels: task.tags,
    assigneeId: task.assignee?.id ?? null,
    parentTaskId: null,
    sprintId,
    startDate: task.startDate ?? null,
    dueDate: task.dueDate ?? null,
    estimatePoints: null,
    estimateHours: null,
    sortOrder: task.sortOrder,
    customFields: null,
  };
}

function sortProjects(projects: ProjectResponse[]) {
  return [...projects].sort((a, b) => {
    if (a.isFavorited !== b.isFavorited) {
      return Number(b.isFavorited) - Number(a.isFavorited);
    }

    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function sortSprints(sprints: LiveSprint[]) {
  const statusRank: Record<SprintStatus, number> = {
    active: 0,
    planning: 1,
    completed: 2,
    cancelled: 3,
  };

  return [...sprints].sort((a, b) => {
    if (statusRank[a.status] !== statusRank[b.status]) {
      return statusRank[a.status] - statusRank[b.status];
    }

    return a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt);
  });
}

function sprintListQueryKey(workspaceId: string | null, projectId: string | null) {
  return ["sprints", workspaceId, projectId, "list"] as const;
}

function sprintDetailQueryKey(workspaceId: string | null, sprintId: string | null) {
  return ["sprints", workspaceId, sprintId, "detail"] as const;
}

function projectTasksQueryKey(workspaceId: string | null, projectId: string | null) {
  return ["sprints", workspaceId, projectId, "tasks"] as const;
}

export function useSprintsData() {
  const { apiClient, session } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const projectsQuery = useQuery<ProjectResponse[]>({
    queryKey: ["sprints", activeWorkspaceId, "projects"],
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () =>
      apiClient.listProjects({
        pageSize: 100,
        sortBy: "updatedAt",
        sortOrder: "desc",
      }),
  });

  const projects = useMemo(
    () => sortProjects(projectsQuery.data ?? []),
    [projectsQuery.data],
  );

  const [preferredSelectedProjectId, setPreferredSelectedProjectId] = useState<string | null>(null);
  const [preferredSelectedSprintId, setPreferredSelectedSprintId] = useState<string | null>(null);

  const selectedProjectId = useMemo(() => {
    if (projects.length === 0) {
      return null;
    }

    if (
      preferredSelectedProjectId &&
      projects.some((project) => project.id === preferredSelectedProjectId)
    ) {
      return preferredSelectedProjectId;
    }

    return projects[0]?.id ?? null;
  }, [preferredSelectedProjectId, projects]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const sprintsQuery = useQuery<LiveSprint[]>({
    queryKey: sprintListQueryKey(activeWorkspaceId, selectedProjectId),
    enabled: !!selectedProjectId,
    staleTime: 15_000,
    queryFn: async () => {
      const sprints = await apiClient.listSprints(selectedProjectId!, {});
      return sprints.map(toLiveSprint).filter((sprint): sprint is LiveSprint => sprint !== null);
    },
  });

  const orderedSprints = useMemo(
    () => sortSprints(sprintsQuery.data ?? []),
    [sprintsQuery.data],
  );

  const selectedSprintId = useMemo(() => {
    if (orderedSprints.length === 0) {
      return null;
    }

    if (
      preferredSelectedSprintId &&
      orderedSprints.some((sprint) => sprint.id === preferredSelectedSprintId)
    ) {
      return preferredSelectedSprintId;
    }

    return (
      orderedSprints.find((sprint) => sprint.status === "active")?.id ??
      orderedSprints[0]?.id ??
      null
    );
  }, [orderedSprints, preferredSelectedSprintId]);

  const selectedSprintQuery = useQuery<LiveSprint | null>({
    queryKey: sprintDetailQueryKey(activeWorkspaceId, selectedSprintId),
    enabled: !!selectedSprintId,
    staleTime: 15_000,
    initialData:
      orderedSprints.find((sprint) => sprint.id === selectedSprintId) ?? undefined,
    queryFn: async () => {
      const sprint = await apiClient.getSprint(selectedSprintId!);
      return toLiveSprint(sprint);
    },
  });

  const selectedSprint =
    selectedSprintQuery.data ?? orderedSprints.find((sprint) => sprint.id === selectedSprintId) ?? null;

  const projectTasksQuery = useQuery<LiveSprintTask[]>({
    queryKey: projectTasksQueryKey(activeWorkspaceId, selectedProjectId),
    enabled: !!selectedProjectId,
    staleTime: 15_000,
    queryFn: async () => {
      const tasks = await apiClient.listTasks({
        projectId: selectedProjectId!,
        pageSize: 100,
        sortBy: "sortOrder",
        sortOrder: "asc",
      });

      return tasks.map(toLiveTask).filter((task): task is LiveSprintTask => task !== null);
    },
  });

  const projectTasks = useMemo(() => projectTasksQuery.data ?? [], [projectTasksQuery.data]);
  const sprintTasks = useMemo(
    () => projectTasks.filter((task) => task.sprintId === selectedSprint?.id),
    [projectTasks, selectedSprint?.id],
  );
  const backlogTasks = useMemo(
    () => projectTasks.filter((task) => !task.sprintId && task.status !== "Done"),
    [projectTasks],
  );

  const todoTasks = useMemo(
    () => sprintTasks.filter((task) => task.status === "To Do"),
    [sprintTasks],
  );
  const inProgressTasks = useMemo(
    () => sprintTasks.filter((task) => task.status === "In Progress" || task.status === "In Review"),
    [sprintTasks],
  );
  const doneTasks = useMemo(
    () => sprintTasks.filter((task) => task.status === "Done"),
    [sprintTasks],
  );

  const sprintStats = useMemo(
    () => ({
      total: sprintTasks.length,
      completed: doneTasks.length,
      inProgress: inProgressTasks.length,
      todo: todoTasks.length,
    }),
    [sprintTasks.length, doneTasks.length, inProgressTasks.length, todoTasks.length],
  );

  const progressPct = sprintStats.total > 0 ? Math.round((sprintStats.completed / sprintStats.total) * 100) : 0;

  const invalidateSprintData = async (projectId: string | null, sprintId: string | null) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: sprintListQueryKey(activeWorkspaceId, projectId) }),
      queryClient.invalidateQueries({ queryKey: sprintDetailQueryKey(activeWorkspaceId, sprintId) }),
      queryClient.invalidateQueries({ queryKey: projectTasksQueryKey(activeWorkspaceId, projectId) }),
    ]);
  };

  const createSprintMutation = useMutation({
    mutationFn: async (input: CreateSprintRequest) => {
      if (!selectedProjectId) {
        throw new Error("Select a project before creating a sprint.");
      }

      return apiClient.createSprint(selectedProjectId, input);
    },
    onSuccess: async (createdSprint) => {
      setPreferredSelectedSprintId(createdSprint.id);
      await invalidateSprintData(selectedProjectId, createdSprint.id);
    },
  });

  const updateSprintMutation = useMutation({
    mutationFn: async ({
      sprintId,
      input,
    }: {
      sprintId: string;
      input: UpdateSprintRequest;
    }) => apiClient.updateSprint(sprintId, input),
    onSuccess: async (_updatedSprint, variables) => {
      await invalidateSprintData(selectedProjectId, variables.sprintId);
    },
  });

  const startSprintMutation = useMutation({
    mutationFn: async (sprintId: string) => apiClient.startSprint(sprintId),
    onSuccess: async (_result: SprintTransitionResponse, sprintId) => {
      await invalidateSprintData(selectedProjectId, sprintId);
    },
  });

  const completeSprintMutation = useMutation({
    mutationFn: async (sprintId: string) => apiClient.completeSprint(sprintId),
    onSuccess: async (_result: SprintTransitionResponse, sprintId) => {
      await invalidateSprintData(selectedProjectId, sprintId);
    },
  });

  const deleteSprintMutation = useMutation({
    mutationFn: async (sprintId: string) => apiClient.deleteSprint(sprintId),
    onSuccess: async (_result, sprintId) => {
      if (selectedSprintId === sprintId) {
        setPreferredSelectedSprintId(null);
      }

      await invalidateSprintData(selectedProjectId, sprintId);
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, sprintId }: { taskId: string; sprintId: string | null }) => {
      const task = projectTasks.find((item) => item.id === taskId);

      if (!task) {
        throw new Error("Task data is not available yet.");
      }

      return apiClient.updateTask(taskId, toUpdateTaskRequest(task, sprintId));
    },
    onSuccess: async () => {
      await invalidateSprintData(selectedProjectId, selectedSprint?.id ?? null);
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: BoardTaskStatus }) => {
      const task = projectTasks.find((item) => item.id === taskId);

      if (!task) {
        throw new Error("Task data is not available yet.");
      }

      return apiClient.updateTaskStatus(taskId, { status: denormalizeTaskStatus(status) });
    },
    onSuccess: async () => {
      await invalidateSprintData(selectedProjectId, selectedSprint?.id ?? null);
    },
  });

  const currentUser = session?.user ?? null;

  return {
    projectsQuery,
    sprintsQuery,
    selectedSprintQuery,
    projectTasksQuery,
    projects,
    selectedProjectId,
    setSelectedProjectId: setPreferredSelectedProjectId,
    selectedProject,
    sprints: orderedSprints,
    selectedSprintId,
    setSelectedSprintId: setPreferredSelectedSprintId,
    selectedSprint,
    projectTasks,
    sprintTasks,
    backlogTasks,
    todoTasks,
    inProgressTasks,
    doneTasks,
    sprintStats,
    progressPct,
    currentUser,
    createSprint: async (input: CreateSprintRequest) => createSprintMutation.mutateAsync(input),
    updateSprint: async (sprintId: string, input: UpdateSprintRequest) =>
      updateSprintMutation.mutateAsync({ sprintId, input }),
    startSprint: async (sprintId: string) => startSprintMutation.mutateAsync(sprintId),
    completeSprint: async (sprintId: string) => completeSprintMutation.mutateAsync(sprintId),
    deleteSprint: async (sprintId: string) => deleteSprintMutation.mutateAsync(sprintId),
    moveTaskToSprint: async (taskId: string, sprintId: string | null) =>
      moveTaskMutation.mutateAsync({ taskId, sprintId }),
    updateTaskStatus: async (taskId: string, status: BoardTaskStatus) =>
      updateTaskStatusMutation.mutateAsync({ taskId, status }),
    selectedSprintEditable: selectedSprint
      ? selectedSprint.status === "planning" || selectedSprint.status === "active"
      : false,
    canStartSelectedSprint: selectedSprint?.status === "planning",
    canCompleteSelectedSprint: selectedSprint?.status === "active",
    isLoadingProjects: projectsQuery.isLoading,
    isLoadingSprints: sprintsQuery.isLoading,
    isLoadingTasks: projectTasksQuery.isLoading,
    isLoadingSprintDetail: selectedSprintQuery.isLoading,
    projectsError: projectsQuery.error,
    sprintsError: sprintsQuery.error,
    tasksError: projectTasksQuery.error,
    sprintDetailError: selectedSprintQuery.error,
    isCreatingSprint: createSprintMutation.isPending,
    isUpdatingSprint: updateSprintMutation.isPending,
    isStartingSprint: startSprintMutation.isPending,
    isCompletingSprint: completeSprintMutation.isPending,
    isDeletingSprint: deleteSprintMutation.isPending,
    isMovingTask: moveTaskMutation.isPending,
    isUpdatingTaskStatus: updateTaskStatusMutation.isPending,
    actionError:
      createSprintMutation.error ??
      updateSprintMutation.error ??
      startSprintMutation.error ??
      completeSprintMutation.error ??
      deleteSprintMutation.error ??
      moveTaskMutation.error ??
      updateTaskStatusMutation.error ??
      null,
  };
}
