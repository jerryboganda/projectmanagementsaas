export type AnalyticsReportType = "tasks" | "velocity" | "workload";

export interface VelocitySprintData {
  sprintId: string;
  name: string;
  plannedPoints?: number | null;
  completedPoints?: number | null;
  startDate: string;
  endDate: string;
}

export interface VelocityResponse {
  projectId?: string | null;
  sprints: VelocitySprintData[];
  averageVelocity: number;
}

export interface BurndownResponse {
  sprintId: string;
  name: string;
  startDate: string;
  endDate: string;
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
}
