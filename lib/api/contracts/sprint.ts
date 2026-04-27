export type SprintStatus = "Planned" | "Active" | "Completed" | "Cancelled" | number;

export interface SprintResponse {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  plannedPoints?: number | null;
  completedPoints?: number | null;
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSprintRequest {
  name: string;
  goal?: string | null;
  startDate: string;
  endDate: string;
}

export interface UpdateSprintRequest {
  name: string;
  goal?: string | null;
  startDate: string;
  endDate: string;
}

export interface SprintTransitionResponse {
  id: string;
  status: SprintStatus;
  completedPoints?: number | null;
}
