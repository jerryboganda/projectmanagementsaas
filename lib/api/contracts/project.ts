import type { ApiUserBrief } from "./common";

export type ProjectStatus = "Active" | "Paused" | "Completed" | "Archived" | number;
export type ProjectVisibility = "Workspace" | "Private" | "Public" | number;

export interface ProjectResponse {
  id: string;
  workspaceId: string;
  name: string;
  identifier: string;
  description?: string | null;
  color?: string | null;
  iconUrl?: string | null;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  lead?: ApiUserBrief | null;
  startDate?: string | null;
  targetDate?: string | null;
  sortOrder: number;
  taskCount: number;
  completedTaskCount: number;
  isFavorited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetailResponse extends ProjectResponse {
  openTaskCount: number;
  memberCount: number;
  metadata?: Record<string, unknown> | null;
}

export interface CreateProjectRequest {
  name: string;
  identifier: string;
  description?: string | null;
  color?: string | null;
  iconUrl?: string | null;
  status?: ProjectStatus | null;
  visibility?: ProjectVisibility | null;
  leadId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface CreateProjectFromTemplateRequest {
  templateId: string;
  name: string;
  identifier: string;
  description?: string | null;
  leadId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
}

export interface UpdateProjectRequest {
  name: string;
  identifier: string;
  description?: string | null;
  color?: string | null;
  iconUrl?: string | null;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  leadId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  sortOrder?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface FavoriteToggleResponse {
  isFavorited: boolean;
}

export interface ProjectTemplateTaskResponse {
  title: string;
  description: string;
  status: "To Do" | "In Progress" | "In Review" | "Done" | "Cancelled";
  priority: "Low" | "Medium" | "High" | "Urgent";
  subtasks: string[];
  tags: string[];
}

export interface ProjectTemplateResponse {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  iconUrl?: string | null;
  isSystemTemplate: boolean;
  taskTemplates: ProjectTemplateTaskResponse[];
  createdAt: string;
  updatedAt: string;
}
