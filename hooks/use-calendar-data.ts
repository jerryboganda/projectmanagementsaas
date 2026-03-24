"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type {
  CalendarItemResponse,
  CalendarItemType,
  CreateCalendarItemRequest,
  ProjectResponse,
  UpdateCalendarItemRequest,
} from "@/lib/api/contracts";

export type CalendarSurfaceItemType =
  | "Event"
  | "Milestone"
  | "Deadline"
  | "Meeting"
  | "Reminder";

type CalendarViewMode = "month" | "week" | "day" | "agenda";

export interface CalendarSurfaceItem {
  id: string;
  title: string;
  description?: string;
  type: CalendarSurfaceItemType;
  color?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  recurrenceRule?: string;
  linkedTaskId?: string;
  linkedProjectId?: string;
  creator?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CalendarProjectOption {
  id: string;
  name: string;
  color?: string;
}

export interface CalendarTaskOption {
  id: string;
  title: string;
  projectId?: string;
  projectName?: string;
}

export interface CalendarUpsertInput {
  title: string;
  description?: string;
  type: CalendarSurfaceItemType;
  color?: string;
  startTime: string | Date;
  endTime: string | Date;
  isAllDay?: boolean;
  recurrenceRule?: string;
  linkedTaskId?: string;
  linkedProjectId?: string;
}

const CALENDAR_TYPE_BY_VALUE: Record<number, CalendarSurfaceItemType> = {
  0: "Event",
  1: "Milestone",
  2: "Deadline",
  3: "Meeting",
  4: "Reminder",
};

const CALENDAR_TYPE_TO_VALUE: Record<CalendarSurfaceItemType, number> = {
  Event: 0,
  Milestone: 1,
  Deadline: 2,
  Meeting: 3,
  Reminder: 4,
};

const DEFAULT_TYPE_COLORS: Record<CalendarSurfaceItemType, string> = {
  Event: "#2563EB",
  Milestone: "#D97706",
  Deadline: "#DC2626",
  Meeting: "#059669",
  Reminder: "#7C3AED",
};

export const calendarItemTypeOptions: Array<{
  value: CalendarSurfaceItemType;
  label: string;
}> = [
  { value: "Event", label: "Event" },
  { value: "Milestone", label: "Milestone" },
  { value: "Deadline", label: "Deadline" },
  { value: "Meeting", label: "Meeting" },
  { value: "Reminder", label: "Reminder" },
];

function normalizeCalendarItemType(type: CalendarItemType): CalendarSurfaceItemType {
  if (typeof type === "number") {
    return CALENDAR_TYPE_BY_VALUE[type] ?? "Event";
  }

  const normalized = type.trim().toLowerCase();
  switch (normalized) {
    case "event":
      return "Event";
    case "milestone":
      return "Milestone";
    case "deadline":
      return "Deadline";
    case "meeting":
      return "Meeting";
    case "reminder":
      return "Reminder";
    default:
      return "Event";
  }
}

function toApiCalendarItemType(type: CalendarSurfaceItemType): number {
  return CALENDAR_TYPE_TO_VALUE[type];
}

function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toCreateCalendarItemRequest(input: CalendarUpsertInput): CreateCalendarItemRequest {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    type: toApiCalendarItemType(input.type),
    color: input.color?.trim() || DEFAULT_TYPE_COLORS[input.type],
    startTime: toIsoString(input.startTime),
    endTime: toIsoString(input.endTime),
    isAllDay: input.isAllDay ?? false,
    recurrenceRule: input.recurrenceRule?.trim() || null,
    linkedTaskId: input.linkedTaskId ?? null,
    linkedProjectId: input.linkedProjectId ?? null,
  };
}

function toUpdateCalendarItemRequest(input: CalendarUpsertInput): UpdateCalendarItemRequest {
  return toCreateCalendarItemRequest(input);
}

function calendarItemsQueryKey(workspaceId: string | null, startIso: string, endIso: string) {
  return ["calendar", workspaceId, startIso, endIso] as const;
}

function calendarProjectsQueryKey(workspaceId: string | null) {
  return ["calendar", workspaceId, "projects"] as const;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function getVisibleWindow(currentDate: Date, viewMode: CalendarViewMode) {
  if (viewMode === "month") {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const start = startOfDay(new Date(firstDayOfMonth));
    start.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

    const end = new Date(start);
    end.setDate(start.getDate() + 41);
    return {
      start,
      end: endOfDay(end),
    };
  }

  if (viewMode === "week") {
    const start = startOfDay(new Date(currentDate));
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start,
      end: endOfDay(end),
    };
  }

  if (viewMode === "agenda") {
    const start = startOfDay(new Date(currentDate));
    const end = new Date(start);
    end.setDate(start.getDate() + 13);
    return {
      start,
      end: endOfDay(end),
    };
  }

  return {
    start: startOfDay(currentDate),
    end: endOfDay(currentDate),
  };
}

function toSurfaceItems(items: CalendarItemResponse[]): CalendarSurfaceItem[] {
  return items.map((item) => {
    const type = normalizeCalendarItemType(item.type);

    return {
      id: item.id,
      title: item.title,
      description: item.description ?? undefined,
      type,
      color: item.color ?? DEFAULT_TYPE_COLORS[type],
      startTime: item.startTime,
      endTime: item.endTime,
      isAllDay: item.isAllDay,
      recurrenceRule: item.recurrenceRule ?? undefined,
      linkedTaskId: item.linkedTaskId ?? undefined,
      linkedProjectId: item.linkedProjectId ?? undefined,
      creator: {
        id: item.creator.id,
        fullName: item.creator.fullName,
        avatarUrl: item.creator.avatarUrl ?? undefined,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });
}

export function useCalendarData(currentDate: Date, viewMode: CalendarViewMode) {
  const { apiClient } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const visibleWindow = useMemo(
    () => getVisibleWindow(currentDate, viewMode),
    [currentDate, viewMode],
  );
  const startIso = visibleWindow.start.toISOString();
  const endIso = visibleWindow.end.toISOString();

  const projectsQuery = useQuery<ProjectResponse[]>({
    queryKey: calendarProjectsQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () =>
      apiClient.listProjects({
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      }),
  });

  const itemsQuery = useQuery<CalendarItemResponse[]>({
    queryKey: calendarItemsQueryKey(activeWorkspaceId, startIso, endIso),
    enabled: !!activeWorkspaceId,
    staleTime: 15_000,
    queryFn: async () =>
      apiClient.listCalendarItems({
        start: startIso,
        end: endIso,
      }),
  });

  const items = useMemo(
    () => toSurfaceItems(itemsQuery.data ?? []),
    [itemsQuery.data],
  );

  const projects = useMemo<CalendarProjectOption[]>(
    () =>
      (projectsQuery.data ?? []).map((project) => ({
        id: project.id,
        name: project.name,
        color: project.color ?? undefined,
      })),
    [projectsQuery.data],
  );

  const invalidateVisibleWindow = async () => {
    await queryClient.invalidateQueries({
      queryKey: calendarItemsQueryKey(activeWorkspaceId, startIso, endIso),
    });
  };

  const createCalendarItemMutation = useMutation({
    mutationFn: async (input: CalendarUpsertInput) =>
      apiClient.createCalendarItem(toCreateCalendarItemRequest(input)),
    onSuccess: invalidateVisibleWindow,
  });

  const updateCalendarItemMutation = useMutation({
    mutationFn: async ({
      calendarItemId,
      input,
    }: {
      calendarItemId: string;
      input: CalendarUpsertInput;
    }) => apiClient.updateCalendarItem(calendarItemId, toUpdateCalendarItemRequest(input)),
    onSuccess: invalidateVisibleWindow,
  });

  const deleteCalendarItemMutation = useMutation({
    mutationFn: async (calendarItemId: string) => apiClient.deleteCalendarItem(calendarItemId),
    onSuccess: invalidateVisibleWindow,
  });

  return {
    itemsQuery,
    projectsQuery,
    items,
    projects,
    isLoading: itemsQuery.isLoading || projectsQuery.isLoading,
    error: itemsQuery.error ?? projectsQuery.error ?? null,
    createCalendarItem: async (input: CalendarUpsertInput) =>
      createCalendarItemMutation.mutateAsync(input),
    updateCalendarItem: async (calendarItemId: string, input: CalendarUpsertInput) =>
      updateCalendarItemMutation.mutateAsync({ calendarItemId, input }),
    deleteCalendarItem: async (calendarItemId: string) =>
      deleteCalendarItemMutation.mutateAsync(calendarItemId),
    isCreatingCalendarItem: createCalendarItemMutation.isPending,
    isUpdatingCalendarItem: updateCalendarItemMutation.isPending,
    isDeletingCalendarItem: deleteCalendarItemMutation.isPending,
  };
}
