export interface WorkloadMember {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  assignedTasks: number;
  completedTasks: number;
  totalPoints: number;
  totalHoursLogged: number;
}

export interface WorkloadResponse {
  members: WorkloadMember[];
}
