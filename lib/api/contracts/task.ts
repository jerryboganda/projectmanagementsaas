import type { ApiUserBrief } from "./common";

export type TaskStatus =
  | "Backlog"
  | "Todo"
  | "InProgress"
  | "InReview"
  | "Done"
  | "Cancelled"
  | number;

export type TaskPriority = "None" | "Low" | "Medium" | "High" | "Urgent" | number;

export interface TaskResponse {
  id: string;
  projectId: string;
  identifier: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  taskType?: string | null;
  labels: string[];
  assignee?: ApiUserBrief | null;
  creator?: ApiUserBrief | null;
  parentTaskId?: string | null;
  sprintId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  estimatePoints?: number | null;
  estimateHours?: number | null;
  sortOrder: number;
  commentCount: number;
  attachmentCount: number;
  checklistTotal: number;
  checklistCompleted: number;
  watcherCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description?: string | null;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  taskType?: string | null;
  labels?: string[] | null;
  assigneeId?: string | null;
  parentTaskId?: string | null;
  sprintId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  estimatePoints?: number | null;
  estimateHours?: number | null;
  customFields?: Record<string, unknown> | null;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  taskType?: string | null;
  labels?: string[] | null;
  assigneeId?: string | null;
  parentTaskId?: string | null;
  sprintId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  estimatePoints?: number | null;
  estimateHours?: number | null;
  sortOrder?: number | null;
  customFields?: Record<string, unknown> | null;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface CreatedTaskResponse {
  id: string;
  identifier: string;
}

export interface UpdatedTaskStatusResponse {
  id: string;
  status: TaskStatus;
}
