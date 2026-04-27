export type GoalStatus = "OnTrack" | "AtRisk" | "OffTrack" | "Completed" | "Cancelled" | number;
export type GoalType = "Objective" | "KeyResult" | number;
export type GoalProgressSource = "Manual" | "LinkedProjects" | "LinkedTasks" | number;
export type InitiativeStatus = "Planned" | "InProgress" | "Completed" | "Cancelled" | number;

export interface GoalUserBrief {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface GoalProjectLinkResponse {
  id: string;
  goalId: string;
  projectId: string;
  createdAt: string;
}

export interface InitiativeResponse {
  id: string;
  goalId: string;
  title: string;
  description?: string | null;
  status: InitiativeStatus;
  owner?: GoalUserBrief | null;
  startDate?: string | null;
  targetDate?: string | null;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalResponse {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  status: GoalStatus;
  type: GoalType;
  progressPercent: number;
  progressSource: GoalProgressSource;
  owner?: GoalUserBrief | null;
  startDate?: string | null;
  targetDate?: string | null;
  parentGoalId?: string | null;
  subGoals?: GoalResponse[] | null;
  projectLinks?: GoalProjectLinkResponse[] | null;
  initiatives?: InitiativeResponse[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string | null;
  status?: GoalStatus | null;
  type?: GoalType | null;
  progressPercent?: number | null;
  progressSource?: GoalProgressSource | null;
  ownerId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  parentGoalId?: string | null;
}

export interface UpdateGoalRequest {
  title: string;
  description?: string | null;
  status: GoalStatus;
  type: GoalType;
  progressPercent?: number | null;
  progressSource?: GoalProgressSource | null;
  ownerId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  parentGoalId?: string | null;
}

export interface LinkProjectRequest {
  projectId: string;
}

export interface CreateInitiativeRequest {
  title: string;
  description?: string | null;
  status?: InitiativeStatus | null;
  ownerId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  progressPercent?: number | null;
}

export interface UpdateInitiativeRequest {
  title: string;
  description?: string | null;
  status: InitiativeStatus;
  ownerId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  progressPercent?: number | null;
}
