"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type {
  CreateTimeEntryRequest,
  ProjectResponse,
  TaskResponse,
  TimeEntryResponse,
  UpdateTimeEntryRequest,
  WorkspaceMemberResponse,
} from "@/lib/api/contracts";

export interface TimeTrackingUser {
  id: string;
  name: string;
  initials: string;
  avatar?: string | null;
}

export interface TimeTrackingTask {
  id: string;
  title: string;
  projectId?: string | null;
}

export interface TimeTrackingProject {
  id: string;
  name: string;
}

export interface TimeTrackingEntry {
  id: string;
  taskId: string;
  userId: string;
  date: string;
  hours: number;
  description?: string;
  projectId?: string | null;
  isBillable: boolean;
  startTime: string;
  endTime?: string | null;
}

export interface TimeEntryCreateInput {
  taskId: string;
  date: string;
  hours: number;
  description?: string;
  isBillable?: boolean;
}

export interface TimeEntryUpdateInput {
  hours?: number;
  description?: string;
  isBillable?: boolean;
}

export type TimerState = "idle" | "running" | "paused";

export interface TimerData {
  state: TimerState;
  elapsedSeconds: number;
  taskId: string | null;
  description: string;
  isBillable: boolean;
  /** The server-side time entry ID returned by startTimer, if available */
  serverEntryId: string | null;
  startedAt: number | null;
  pausedAt: number | null;
}

export interface ComputedStats {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  billablePct: number;
  tasksTracked: number;
  avgHoursPerDay: number;
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function localDateKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function toEntrySurface(entry: TimeEntryResponse): TimeTrackingEntry | null {
  if (!entry.taskId) {
    return null;
  }

  return {
    id: entry.id,
    taskId: entry.taskId,
    userId: entry.user.id,
    date: localDateKey(entry.startTime),
    hours: Number((entry.durationMinutes / 60).toFixed(2)),
    description: entry.description ?? undefined,
    projectId: entry.projectId ?? null,
    isBillable: entry.isBillable,
    startTime: entry.startTime,
    endTime: entry.endTime ?? null,
  };
}

function timeEntriesQueryKey(workspaceId: string | null, start: string, end: string) {
  return ["time-entries", workspaceId, start, end] as const;
}

function timeTrackingTasksQueryKey(workspaceId: string | null) {
  return ["time-tracking", workspaceId, "tasks"] as const;
}

function timeTrackingProjectsQueryKey(workspaceId: string | null) {
  return ["time-tracking", workspaceId, "projects"] as const;
}

function timeTrackingMembersQueryKey(workspaceId: string | null) {
  return ["time-tracking", workspaceId, "members"] as const;
}

function toCreateTimeEntryRequest(
  input: TimeEntryCreateInput,
  tasksById: Map<string, TaskResponse>,
): CreateTimeEntryRequest {
  const startTime = new Date(`${input.date}T09:00:00`);
  const durationMinutes = Math.max(Math.round(input.hours * 60), 15);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);
  const task = tasksById.get(input.taskId);

  return {
    taskId: input.taskId,
    projectId: task?.projectId ?? null,
    description: input.description?.trim() || null,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMinutes,
    isBillable: input.isBillable ?? false,
    hourlyRate: null,
  };
}

const INITIAL_TIMER: TimerData = {
  state: "idle",
  elapsedSeconds: 0,
  taskId: null,
  description: "",
  isBillable: false,
  serverEntryId: null,
  startedAt: null,
  pausedAt: null,
};

export function useTimeTrackingData(start: Date, end: Date) {
  const { apiClient, session } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  // ── Timer local state ────────────────────────────────────────────────────
  const [timer, setTimer] = useState<TimerData>(INITIAL_TIMER);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick every second while running
  useEffect(() => {
    if (timer.state === "running") {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev.state !== "running" || prev.startedAt === null) return prev;
          const now = Date.now();
          const delta = Math.floor((now - prev.startedAt) / 1000);
          return { ...prev, elapsedSeconds: delta };
        });
      }, 1000);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer.state]);

  const startTimer = useCallback(
    async (taskId: string, description: string, isBillable: boolean) => {
      const now = Date.now();
      let serverEntryId: string | null = null;

      try {
        const task = (queryClient.getQueryData<TaskResponse[]>(
          timeTrackingTasksQueryKey(activeWorkspaceId),
        ) ?? []).find((t) => t.id === taskId);

        const entry = await apiClient.startTimer({
          taskId,
          projectId: task?.projectId ?? null,
          description: description || null,
          isBillable,
        });
        serverEntryId = entry.id;
      } catch {
        // API may not be wired; continue with local-only timer
      }

      setTimer({
        state: "running",
        elapsedSeconds: 0,
        taskId,
        description,
        isBillable,
        serverEntryId,
        startedAt: now,
        pausedAt: null,
      });
    },
    [apiClient, activeWorkspaceId, queryClient],
  );

  const pauseTimer = useCallback(() => {
    setTimer((prev) => {
      if (prev.state !== "running") return prev;
      return {
        ...prev,
        state: "paused",
        pausedAt: Date.now(),
      };
    });
  }, []);

  const resumeTimer = useCallback(() => {
    setTimer((prev) => {
      if (prev.state !== "paused" || prev.pausedAt === null || prev.startedAt === null) return prev;
      const pauseDuration = Date.now() - prev.pausedAt;
      return {
        ...prev,
        state: "running",
        startedAt: prev.startedAt + pauseDuration,
        pausedAt: null,
      };
    });
  }, []);

  const stopTimer = useCallback(async () => {
    const snap = timer;
    setTimer(INITIAL_TIMER);

    if (snap.state === "idle") return;

    const hours = Number((snap.elapsedSeconds / 3600).toFixed(2));
    const clampedHours = Math.max(hours, 0.25);

    try {
      if (snap.serverEntryId) {
        await apiClient.stopTimer(snap.serverEntryId);
      } else if (snap.taskId) {
        const today = new Date().toISOString().split("T")[0];
        const taskMap = new Map(
          (queryClient.getQueryData<TaskResponse[]>(
            timeTrackingTasksQueryKey(activeWorkspaceId),
          ) ?? []).map((t) => [t.id, t]),
        );
        await apiClient.createTimeEntry(
          toCreateTimeEntryRequest(
            {
              taskId: snap.taskId,
              date: today,
              hours: clampedHours,
              description: snap.description || undefined,
              isBillable: snap.isBillable,
            },
            taskMap,
          ),
        );
      }
    } catch {
      // Best-effort save; silently ignore network errors
    }

    await queryClient.invalidateQueries({
      queryKey: timeEntriesQueryKey(activeWorkspaceId, start.toISOString(), end.toISOString()),
    });
  }, [timer, apiClient, activeWorkspaceId, queryClient, start, end]);

  // ── Queries ──────────────────────────────────────────────────────────────

  const tasksQuery = useQuery<TaskResponse[]>({
    queryKey: timeTrackingTasksQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () =>
      apiClient.listTasks({
        pageSize: 200,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  const projectsQuery = useQuery<ProjectResponse[]>({
    queryKey: timeTrackingProjectsQueryKey(activeWorkspaceId),
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
    queryKey: timeTrackingMembersQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => apiClient.listWorkspaceMembers(activeWorkspaceId!),
  });

  const entriesQuery = useQuery<TimeEntryResponse[]>({
    queryKey: timeEntriesQueryKey(activeWorkspaceId, start.toISOString(), end.toISOString()),
    enabled: !!activeWorkspaceId,
    staleTime: 15_000,
    queryFn: async () =>
      apiClient.listTimeEntries({
        startedAfter: start.toISOString(),
        startedBefore: endOfDay(end).toISOString(),
      }),
  });

  const tasksById = useMemo(
    () => new Map((tasksQuery.data ?? []).map((task) => [task.id, task])),
    [tasksQuery.data],
  );

  // ── Mutations ────────────────────────────────────────────────────────────

  const createTimeEntryMutation = useMutation({
    mutationFn: async (input: TimeEntryCreateInput) =>
      apiClient.createTimeEntry(toCreateTimeEntryRequest(input, tasksById)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: timeEntriesQueryKey(activeWorkspaceId, start.toISOString(), end.toISOString()),
      });
    },
  });

  const updateTimeEntryMutation = useMutation({
    mutationFn: async ({
      id,
      entry,
      patch,
    }: {
      id: string;
      entry: TimeTrackingEntry;
      patch: TimeEntryUpdateInput;
    }) => {
      const hours = patch.hours ?? entry.hours;
      const durationMinutes = Math.max(Math.round(hours * 60), 15);
      const startTime = new Date(entry.startTime);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);

      const req: UpdateTimeEntryRequest = {
        taskId: entry.taskId,
        projectId: entry.projectId ?? null,
        description: patch.description !== undefined ? (patch.description || null) : (entry.description ?? null),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes,
        isBillable: patch.isBillable !== undefined ? patch.isBillable : entry.isBillable,
        hourlyRate: null,
      };

      return apiClient.updateTimeEntry(id, req);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: timeEntriesQueryKey(activeWorkspaceId, start.toISOString(), end.toISOString()),
      });
    },
  });

  const deleteTimeEntryMutation = useMutation({
    mutationFn: async (timeEntryId: string) => apiClient.deleteTimeEntry(timeEntryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: timeEntriesQueryKey(activeWorkspaceId, start.toISOString(), end.toISOString()),
      });
    },
  });

  // ── Derived data ─────────────────────────────────────────────────────────

  const entries = useMemo(
    () =>
      (entriesQuery.data ?? [])
        .map(toEntrySurface)
        .filter((entry): entry is TimeTrackingEntry => entry !== null),
    [entriesQuery.data],
  );

  const tasks = useMemo<TimeTrackingTask[]>(
    () =>
      (tasksQuery.data ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        projectId: task.projectId ?? null,
      })),
    [tasksQuery.data],
  );

  const projects = useMemo<TimeTrackingProject[]>(
    () =>
      (projectsQuery.data ?? []).map((project) => ({
        id: project.id,
        name: project.name,
      })),
    [projectsQuery.data],
  );

  const users = useMemo<TimeTrackingUser[]>(
    () =>
      (membersQuery.data ?? []).map((member) => ({
        id: member.userId,
        name: member.fullName,
        initials: initialsFor(member.fullName),
        avatar: member.avatarUrl ?? null,
      })),
    [membersQuery.data],
  );

  const currentUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.displayName ?? session.user.fullName,
      }
    : null;

  // ── Computed stats ───────────────────────────────────────────────────────

  const computedStats = useMemo<ComputedStats>(() => {
    const totalHours = entries.reduce((s, e) => s + e.hours, 0);
    const billableHours = entries.filter((e) => e.isBillable).reduce((s, e) => s + e.hours, 0);
    const nonBillableHours = totalHours - billableHours;
    const billablePct = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;
    const tasksTracked = new Set(entries.map((e) => e.taskId)).size;
    const daysInRange =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const avgHoursPerDay = daysInRange > 0 ? totalHours / daysInRange : 0;
    return { totalHours, billableHours, nonBillableHours, billablePct, tasksTracked, avgHoursPerDay };
  }, [entries, start, end]);

  // ── Export ───────────────────────────────────────────────────────────────

  const exportEntries = useCallback(
    (entriesToExport: TimeTrackingEntry[]) => {
      const header = ["Date", "Task", "Project", "Hours", "Description", "Billable"];
      const rows = entriesToExport.map((e) => {
        const task = tasks.find((t) => t.id === e.taskId);
        const proj = projects.find(
          (p) => p.id === (e.projectId ?? task?.projectId),
        );
        return [
          e.date,
          task?.title ?? e.taskId,
          proj?.name ?? "",
          e.hours.toString(),
          e.description ?? "",
          e.isBillable ? "Yes" : "No",
        ];
      });

      const csvContent = [header, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `time-entries-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
    [tasks, projects],
  );

  return {
    entriesQuery,
    tasksQuery,
    projectsQuery,
    membersQuery,
    entries,
    tasks,
    projects,
    users,
    currentUser,
    createTimeEntry: async (input: TimeEntryCreateInput) =>
      createTimeEntryMutation.mutateAsync(input),
    updateTimeEntry: async (id: string, entry: TimeTrackingEntry, patch: TimeEntryUpdateInput) =>
      updateTimeEntryMutation.mutateAsync({ id, entry, patch }),
    deleteTimeEntry: async (timeEntryId: string) =>
      deleteTimeEntryMutation.mutateAsync(timeEntryId),
    isCreatingTimeEntry: createTimeEntryMutation.isPending,
    isUpdatingTimeEntry: updateTimeEntryMutation.isPending,
    isDeletingTimeEntry: deleteTimeEntryMutation.isPending,
    // Timer
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    // Stats & export
    computedStats,
    exportEntries,
  };
}
