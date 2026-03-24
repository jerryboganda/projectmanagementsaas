import { format, parseISO } from "date-fns";
import type {
  CreateProjectRequest,
  ProjectDetailResponse,
  ProjectResponse,
  ProjectStatus,
  ProjectVisibility,
  UpdateProjectRequest,
} from "@/lib/api/contracts";

export type ProjectSurfaceStatus = "Planning" | "In Progress" | "Paused" | "Completed";
export type ProjectSurfaceHealth = "On Track" | "At Risk" | "Off Track";

export interface ProjectSurfaceItem {
  id: string;
  identifier: string;
  name: string;
  description: string;
  status: ProjectSurfaceStatus;
  backendStatus: ProjectStatus;
  visibility: ProjectVisibility;
  health: ProjectSurfaceHealth;
  progress: number;
  ownerId?: string | null;
  ownerName: string;
  ownerAvatarUrl?: string | null;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  openTaskCount: number;
  dueDateRaw?: string | null;
  dueDateLabel: string;
  startDateRaw?: string | null;
  isFavorite: boolean;
  color?: string | null;
  iconUrl?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreateInput {
  name: string;
  identifier: string;
  description: string;
  status: ProjectSurfaceStatus;
  dueDate: string;
  color?: string | null;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  status?: ProjectSurfaceStatus;
  dueDate?: string;
}

function isPausedStatus(status: ProjectStatus) {
  return status === "Paused" || status === 1;
}

function isCompletedStatus(status: ProjectStatus) {
  return status === "Completed" || status === 2 || status === "Archived" || status === 3;
}

function toSurfaceStatus(
  status: ProjectStatus,
  taskCount: number,
  completedTaskCount: number,
): ProjectSurfaceStatus {
  if (isCompletedStatus(status)) {
    return "Completed";
  }

  if (isPausedStatus(status)) {
    return "Paused";
  }

  if (taskCount === 0 && completedTaskCount === 0) {
    return "Planning";
  }

  return "In Progress";
}

function formatDueDate(date?: string | null) {
  if (!date) {
    return "No deadline";
  }

  const parsed = parseISO(date);
  if (Number.isNaN(parsed.getTime())) {
    return "No deadline";
  }

  return format(parsed, "MMM dd, yyyy");
}

function isPastDate(date?: string | null) {
  if (!date) {
    return false;
  }

  const parsed = parseISO(date);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
}

export function calculateProjectProgress(taskCount: number, completedTaskCount: number) {
  if (taskCount <= 0) {
    return 0;
  }

  return Math.round((completedTaskCount / taskCount) * 100);
}

function deriveHealth(
  status: ProjectStatus,
  taskCount: number,
  completedTaskCount: number,
  openTaskCount: number,
  dueDate?: string | null,
): ProjectSurfaceHealth {
  if (isCompletedStatus(status) || openTaskCount === 0) {
    return "On Track";
  }

  if (isPausedStatus(status)) {
    return "Off Track";
  }

  const progress = calculateProjectProgress(taskCount, completedTaskCount);
  if (isPastDate(dueDate) && openTaskCount > 0) {
    return "Off Track";
  }

  if (progress < 35 && taskCount > 0) {
    return "At Risk";
  }

  return "On Track";
}

export function toProjectSurfaceItem(
  project: ProjectResponse | ProjectDetailResponse,
  fallbackOwnerName: string,
): ProjectSurfaceItem {
  const openTaskCount =
    "openTaskCount" in project
      ? project.openTaskCount
      : Math.max(project.taskCount - project.completedTaskCount, 0);

  return {
    id: project.id,
    identifier: project.identifier,
    name: project.name,
    description: project.description ?? "",
    status: toSurfaceStatus(project.status, project.taskCount, project.completedTaskCount),
    backendStatus: project.status,
    visibility: project.visibility,
    health: deriveHealth(
      project.status,
      project.taskCount,
      project.completedTaskCount,
      openTaskCount,
      project.targetDate,
    ),
    progress: calculateProjectProgress(project.taskCount, project.completedTaskCount),
    ownerId: project.lead?.id ?? null,
    ownerName: project.lead?.fullName ?? fallbackOwnerName,
    ownerAvatarUrl: project.lead?.avatarUrl ?? null,
    memberCount: "memberCount" in project ? project.memberCount : project.lead ? 1 : 0,
    taskCount: project.taskCount,
    completedTaskCount: project.completedTaskCount,
    openTaskCount,
    dueDateRaw: project.targetDate ?? null,
    dueDateLabel: formatDueDate(project.targetDate),
    startDateRaw: project.startDate ?? null,
    isFavorite: project.isFavorited,
    color: project.color ?? null,
    iconUrl: project.iconUrl ?? null,
    sortOrder: project.sortOrder,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function toApiProjectStatus(status: ProjectSurfaceStatus): ProjectStatus {
  if (status === "Paused") {
    return "Paused";
  }

  if (status === "Completed") {
    return "Completed";
  }

  return "Active";
}

export function buildProjectIdentifier(name: string) {
  const words = name.match(/[A-Za-z0-9]+/g) ?? [];
  const initials = words.map((word) => word[0]).join("").toUpperCase();
  const fallback = name.toUpperCase().replace(/[^A-Z0-9]/g, "");

  let identifier = (initials.length >= 2 ? initials : fallback).replace(/^[^A-Z]+/, "");
  if (!identifier) {
    identifier = "PRJ";
  }

  if (identifier.length < 2) {
    identifier = `${identifier}X`;
  }

  return identifier.slice(0, 10);
}

export function toCreateProjectRequest(
  input: ProjectCreateInput,
  leadId?: string | null,
): CreateProjectRequest {
  return {
    name: input.name.trim(),
    identifier: input.identifier.trim().toUpperCase(),
    description: input.description.trim() || null,
    color: input.color ?? null,
    status: toApiProjectStatus(input.status),
    visibility: "Workspace",
    leadId: leadId ?? null,
    targetDate: input.dueDate || null,
  };
}

export function toUpdateProjectRequest(
  project: ProjectSurfaceItem,
  updates: ProjectUpdateInput,
): UpdateProjectRequest {
  return {
    name: (updates.name ?? project.name).trim(),
    identifier: project.identifier,
    description: (updates.description ?? project.description).trim() || null,
    color: project.color ?? null,
    iconUrl: project.iconUrl ?? null,
    status: toApiProjectStatus(updates.status ?? project.status),
    visibility: project.visibility,
    leadId: project.ownerId ?? null,
    startDate: project.startDateRaw ?? null,
    targetDate: (updates.dueDate ?? project.dueDateRaw) || null,
    sortOrder: project.sortOrder,
  };
}
