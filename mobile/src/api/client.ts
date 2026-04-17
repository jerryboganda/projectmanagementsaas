/**
 * Mobile API client — talks to the LP backend at `/api/v1/*`.
 *
 * Transport:
 *  - fetch() with JSON body + Bearer access token from token-store
 *  - On 401, attempts a single refresh-token exchange, then retries once
 *  - Base URL from VITE_API_BASE_URL env (defaults to '/api/v1')
 *
 * Contracts mirror backend DTOs in
 *  backend/src/LinearPrecision.Shared/Contracts/* and LP's web contracts
 *  (lib/api/contracts.ts). We only pull in the slice the mobile app uses.
 */

import {
  getAccessToken,
  getActiveWorkspaceId,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../auth/token-store';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly problem?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Contract types (mobile slice) ───────────────────────────────────────────

export type WorkspaceRole = 'Owner' | 'Admin' | 'Member' | 'Guest' | number;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  timezone?: string | null;
  locale?: string | null;
  jobTitle?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuthWorkspace {
  workspaceId: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  role: WorkspaceRole;
  createdAt: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUser;
  activeWorkspaceId?: string | null;
  workspaces: AuthWorkspace[];
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  email: string;
  password: string;
  fullName: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  email: string;
  token: string;
  newPassword: string;
}

export interface RefreshBody {
  refreshToken: string;
}

// ─── Core request helper ─────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  /** Skip attaching X-Workspace-Id even when authenticated (e.g. /users/me). */
  skipWorkspace?: boolean;
  signal?: AbortSignal;
  _retry?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, skipWorkspace = false, signal, _retry = false } = opts;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!skipWorkspace) {
      const ws = getActiveWorkspaceId();
      if (ws) headers['X-Workspace-Id'] = ws;
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      credentials: 'include',
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : 'Network error',
      0,
    );
  }

  if (res.status === 401 && auth && !_retry) {
    // Try refresh-once then retry
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, { ...opts, _retry: true });
  }

  const text = await res.text();
  const data = text ? safeParse(text) : undefined;

  if (!res.ok) {
    const message =
      (isProblem(data) && (data.title || data.detail)) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isProblem(d: unknown): d is { title?: string; detail?: string; errors?: Record<string, string[]> } {
  return typeof d === 'object' && d !== null;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;
  try {
    const session = await request<AuthSessionResponse>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken } satisfies RefreshBody,
      auth: false,
    });
    setAccessToken(session.accessToken);
    if (session.refreshToken) await setRefreshToken(session.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (body: LoginBody): Promise<AuthSessionResponse> =>
      request<AuthSessionResponse>('/auth/login', { method: 'POST', body, auth: false }),

    register: (body: RegisterBody): Promise<AuthSessionResponse> =>
      request<AuthSessionResponse>('/auth/register', { method: 'POST', body, auth: false }),

    forgotPassword: (body: ForgotPasswordBody): Promise<void> =>
      request<void>('/auth/forgot-password', { method: 'POST', body, auth: false }),

    resetPassword: (body: ResetPasswordBody): Promise<void> =>
      request<void>('/auth/reset-password', { method: 'POST', body, auth: false }),

    refresh: (refreshToken: string): Promise<AuthSessionResponse> =>
      request<AuthSessionResponse>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken } satisfies RefreshBody,
        auth: false,
      }),

    logout: (): Promise<void> =>
      request<void>('/auth/logout', { method: 'POST', skipWorkspace: true }),
  },

  users: {
    me: (signal?: AbortSignal): Promise<AuthUser> =>
      request<AuthUser>('/users/me', { skipWorkspace: true, signal }),
  },

  projects: {
    list: (params: ListProjectsParams = {}, signal?: AbortSignal): Promise<ProjectResponse[]> => {
      const query = buildQuery(params as Record<string, unknown>);
      return request<ProjectResponse[]>(`/projects${query}`, { signal });
    },
    get: (id: string, signal?: AbortSignal): Promise<ProjectResponse> =>
      request<ProjectResponse>(`/projects/${id}`, { signal }),
  },

  tasks: {
    list: (params: ListTasksParams = {}, signal?: AbortSignal): Promise<TaskResponse[]> => {
      const query = buildQuery(params as Record<string, unknown>);
      return request<TaskResponse[]>(`/tasks${query}`, { signal });
    },
  },

  notifications: {
    list: (
      params: { isRead?: boolean; isArchived?: boolean; pageSize?: number } = {},
      signal?: AbortSignal,
    ): Promise<NotificationResponse[]> => {
      const query = buildQuery(params as Record<string, unknown>);
      return request<NotificationResponse[]>(`/notifications${query}`, { signal });
    },
    markRead: (id: string): Promise<NotificationResponse> =>
      request<NotificationResponse>(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: (): Promise<{ markedCount: number }> =>
      request<{ markedCount: number }>('/notifications/read-all', { method: 'PUT' }),
  },

  search: {
    query: (q: string, signal?: AbortSignal): Promise<SearchResultItem[]> => {
      if (!q.trim()) return Promise.resolve([]);
      const query = buildQuery({ q, pageSize: 20 });
      return request<SearchResultItem[]>(`/search${query}`, { signal });
    },
  },

  calendar: {
    list: (params: { start: string; end: string }, signal?: AbortSignal): Promise<CalendarItemResponse[]> => {
      const query = buildQuery(params as Record<string, unknown>);
      return request<CalendarItemResponse[]>(`/calendar${query}`, { signal });
    },
  },

  goals: {
    list: (params: { status?: string; ownerId?: string; pageSize?: number } = {}, signal?: AbortSignal): Promise<GoalResponse[]> => {
      const query = buildQuery(params as Record<string, unknown>);
      return request<GoalResponse[]>(`/goals${query}`, { signal });
    },
  },

  documents: {
    list: (params: { projectId?: string; pageSize?: number } = {}, signal?: AbortSignal): Promise<DocumentResponse[]> => {
      const query = buildQuery(params as Record<string, unknown>);
      return request<DocumentResponse[]>(`/documents${query}`, { signal });
    },
  },

  sprints: {
    listForProject: (projectId: string, signal?: AbortSignal): Promise<SprintResponse[]> =>
      request<SprintResponse[]>(`/projects/${projectId}/sprints`, { signal }),
  },

  analytics: {
    velocity: (params: { projectId?: string; sprintCount?: number } = {}, signal?: AbortSignal): Promise<VelocityResponse> => {
      const query = buildQuery(params as Record<string, unknown>);
      return request<VelocityResponse>(`/analytics/velocity${query}`, { signal });
    },
    workload: (signal?: AbortSignal): Promise<WorkloadResponse> =>
      request<WorkloadResponse>('/analytics/workload', { signal }),
    burndown: (sprintId: string, signal?: AbortSignal): Promise<BurndownResponse> => {
      const query = buildQuery({ sprintId });
      return request<BurndownResponse>(`/analytics/burndown${query}`, { signal });
    },
  },

  timeEntries: {
    list: (params: { userId?: string; taskId?: string; projectId?: string; startedAfter?: string; startedBefore?: string; isBillable?: boolean } = {}, signal?: AbortSignal): Promise<TimeEntryResponse[]> => {
      const query = buildQuery(params as Record<string, unknown>);
      return request<TimeEntryResponse[]>(`/time-entries${query}`, { signal });
    },
    start: (body: { taskId?: string; projectId?: string; description?: string; isBillable?: boolean }): Promise<TimeEntryResponse> =>
      request<TimeEntryResponse>('/time-entries/start', { method: 'POST', body }),
    stop: (id: string): Promise<TimeEntryResponse> =>
      request<TimeEntryResponse>(`/time-entries/${id}/stop`, { method: 'POST' }),
  },

  automations: {
    list: (params: { isEnabled?: boolean; projectId?: string; pageSize?: number } = {}, signal?: AbortSignal): Promise<AutomationRuleResponse[]> => {
      const query = buildQuery(params as Record<string, unknown>);
      return request<AutomationRuleResponse[]>(`/automations${query}`, { signal });
    },
    update: (id: string, body: UpdateAutomationRuleRequest): Promise<AutomationRuleResponse> =>
      request<AutomationRuleResponse>(`/automations/${id}`, { method: 'PUT', body }),
  },

  projectTemplates: {
    list: (signal?: AbortSignal): Promise<ProjectTemplateResponse[]> =>
      request<ProjectTemplateResponse[]>('/projects/templates', { signal, skipWorkspace: true }),
  },
};

// ─── Domain contracts (mobile slice) ─────────────────────────────────────────

export type TaskStatus =
  | 'Backlog'
  | 'Todo'
  | 'InProgress'
  | 'InReview'
  | 'Done'
  | 'Cancelled'
  | number;
export type TaskPriority = 'None' | 'Low' | 'Medium' | 'High' | 'Urgent' | number;
export type ProjectStatus = 'Active' | 'Paused' | 'Completed' | 'Archived' | number;
export type ProjectVisibility = 'Workspace' | 'Private' | 'Public' | number;

export interface ApiUserBrief {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  email?: string | null;
}

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

export interface ListProjectsParams {
  status?: string;
  leadId?: string;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListTasksParams {
  projectId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  sprintId?: string;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationResponse {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actor?: ApiUserBrief | null;
  isRead: boolean;
  readAt?: string | null;
  isArchived: boolean;
  createdAt: string;
}

export interface SearchResultItem {
  type: string;
  id: string;
  title: string;
  excerpt?: string | null;
  rank: number;
}

export interface CalendarItemResponse {
  id: string;
  title: string;
  description?: string | null;
  type: string | number;
  color?: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  recurrenceRule?: string | null;
  linkedTaskId?: string | null;
  linkedProjectId?: string | null;
  creator: ApiUserBrief;
  createdAt: string;
  updatedAt: string;
}

export interface GoalOwnerBrief {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface GoalResponse {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  status: string | number;
  type: string | number;
  progressPercent: number;
  progressSource: string | number;
  owner?: GoalOwnerBrief | null;
  startDate?: string | null;
  targetDate?: string | null;
  parentGoalId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentResponse {
  id: string;
  workspaceId: string;
  title: string;
  content?: string | null;
  contentFormat: string;
  projectId?: string | null;
  parentDocumentId?: string | null;
  creator: ApiUserBrief;
  isPublished: boolean;
  publishedAt?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SprintResponse {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  status: string | number;
  startDate: string;
  endDate: string;
  plannedPoints?: number | null;
  completedPoints?: number | null;
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

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

export interface TimeEntryResponse {
  id: string;
  user: { id: string; fullName: string; avatarUrl?: string | null };
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

export interface AutomationRuleResponse {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  trigger: unknown;
  action: unknown;
  projectId?: string | null;
  executionCount: number;
  lastExecutedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAutomationRuleRequest {
  name: string;
  description?: string | null;
  isActive?: boolean | null;
  trigger: unknown;
  action: unknown;
  projectId?: string | null;
}

export interface ProjectTemplateTaskResponse {
  title: string;
  description: string;
  status: string;
  priority: string;
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

function buildQuery(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `?${qs}`;
}
