export interface TimeEntryUserBrief {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface TimeEntryResponse {
  id: string;
  user: TimeEntryUserBrief;
  taskId?: string | null;
  projectId?: string | null;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  durationMinutes: number;
  isBillable: boolean;
  hourlyRate?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeEntryRequest {
  taskId?: string | null;
  projectId?: string | null;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  durationMinutes?: number | null;
  isBillable?: boolean | null;
  hourlyRate?: number | null;
}

export interface UpdateTimeEntryRequest {
  taskId?: string | null;
  projectId?: string | null;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  durationMinutes?: number | null;
  isBillable?: boolean | null;
  hourlyRate?: number | null;
}

export interface StartTimerRequest {
  taskId?: string | null;
  projectId?: string | null;
  description?: string | null;
  isBillable?: boolean | null;
}
