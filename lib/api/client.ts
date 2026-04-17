import {
  type AnalyticsReportType,
  type AuthSessionResponse,
  type AuthUser,
  type BurndownResponse,
  type CalendarItemResponse,
  type CreateDocumentRequest,
  type CreateCalendarItemRequest,
  type CreateSprintRequest,
  type CreatedTaskResponse,
  type CreateTaskRequest,
  type CreateTimeEntryRequest,
  type CreateGoalRequest,
  type CreateInitiativeRequest,
  type CreateProjectRequest,
  type CreateProjectFromTemplateRequest,
  type CreateWorkspaceRequest,
  type GoalProjectLinkResponse,
  type GoalResponse,
  type FavoriteToggleResponse,
  type ForgotPasswordRequest,
  type InvitationDetailsResponse,
  type IntakeConvertToTaskRequest,
  type IntakeConvertToTaskResponse,
  type IntakeFormResponse,
  type IntakeReviewSubmissionRequest,
  type IntakeSubmissionResponse,
  type InviteWorkspaceMemberRequest,
  type LoginRequest,
  type MarkAllReadResponse,
  type NotificationPreferenceResponse,
  type NotificationResponse,
  type DocumentResponse,
  type ProjectDetailResponse,
  type ProjectResponse,
  type ProjectTemplateResponse,
  type LinkProjectRequest,
  type InitiativeResponse,
  type SprintResponse,
  type SprintTransitionResponse,
  type TaskResponse,
  type TimeEntryResponse,
  type RegisterRequest,
  type ResetPasswordRequest,
  type UpdateDocumentRequest,
  type UpdateCalendarItemRequest,
  type UpdateGoalRequest,
  type UpdateInitiativeRequest,
  type UpdateNotificationPreferencesRequest,
  type UpdateProfileRequest,
  type UpdateProjectRequest,
  type UpdateSprintRequest,
  type UpdateTaskRequest,
  type UpdateTaskStatusRequest,
  type UpdateTimeEntryRequest,
  type UpdateWorkspaceRequest,
  type UpdateWorkspaceSettingsRequest,
  type UpdatedTaskStatusResponse,
  type VelocityResponse,
  type WorkloadResponse,
  type WorkspaceMemberResponse,
  type WorkspaceResponse,
  type WorkspaceSettingsResponse,
  type StartTimerRequest,
  type SubmitIntakeRequest,
} from "@/lib/api/contracts";
import { getRuntimeConfig, WORKSPACE_HEADER } from "@/lib/runtime/runtime-config";
import { uploadFileToPresignedUrl } from "@/lib/api/presigned-upload";

// ─── AI Copilot contracts ─────────────────────────────────────────────────────

export interface AIConversationResponse {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface CreateAIConversationRequest {
  title?: string;
}

export interface AIMessageResponse {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AIConversationWithMessagesResponse extends AIConversationResponse {
  messages: AIMessageResponse[];
}

export interface SendAIMessageRequest {
  content: string;
}

export interface AIProviderSettingsResponse {
  id: string | null;
  providerName: string;
  baseUrl: string;
  model: string;
  isEnabled: boolean;
  isConfigured: boolean;
  maskedApiKey: string | null;
  updatedAt: string | null;
}

export interface UpdateAIProviderSettingsRequest {
  providerName: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
  isEnabled: boolean;
}

// ─── Task subresource contracts ──────────────────────────────────────────────

export interface TaskCommentResponse {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  authorAvatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskCommentRequest {
  content: string;
}

export interface TaskChecklistItemResponse {
  id: string;
  text: string;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CreateChecklistItemRequest {
  text: string;
}

export interface TaskWatcherResponse {
  userId: string;
  userName: string;
  userInitials: string;
  userAvatarUrl?: string;
  addedAt: string;
}

export interface FileAttachmentResponse {
  id: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
  downloadUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

type JsonBody = object | null | undefined;

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

interface ApiClientOptions {
  accessToken?: string | null;
  workspaceId?: string | null;
}

interface RequestOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: JsonBody;
  headers?: HeadersInit;
  workspaceId?: string | null;
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const { apiBaseUrl } = getRuntimeConfig();
  return `${apiBaseUrl}${normalizedPath}`;
}

function withQuery(
  path: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  // ASP.NET Core ProblemDetails responses use `application/problem+json`.
  // Accept any JSON-flavoured content type so validation error bodies
  // (errors[], title, detail) are parsed as objects, not raw strings.
  if (/\bjson\b/i.test(contentType)) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text ? text : null;
}

export class LinearPrecisionApiClient {
  private readonly accessToken?: string | null;
  private readonly workspaceId?: string | null;

  constructor(options: ApiClientOptions = {}) {
    this.accessToken = options.accessToken;
    this.workspaceId = options.workspaceId;
  }

  async request<T>(path: string, options: RequestOptions = {}) {
    const headers = new Headers(options.headers);

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    if (options.body !== undefined && options.body !== null && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (this.accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    const workspaceId = options.workspaceId ?? this.workspaceId;
    if (workspaceId && !headers.has(WORKSPACE_HEADER)) {
      headers.set(WORKSPACE_HEADER, workspaceId);
    }

    // Apply a default 20s timeout to every request so an unreachable backend
    // cannot leave the UI hung on pending network promises. Callers that pass
    // an explicit AbortSignal keep full control and bypass the default.
    const signal =
      options.signal ??
      (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
        ? AbortSignal.timeout(20_000)
        : undefined);

    const response = await fetch(buildUrl(path), {
      ...options,
      headers,
      body:
        options.body !== undefined && options.body !== null
          ? JSON.stringify(options.body)
          : undefined,
      credentials: "include",
      signal,
    });

    const payload = await parseResponse(response);

    if (!response.ok) {
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "detail" in payload &&
        typeof payload.detail === "string"
          ? payload.detail
          : `Request failed with status ${response.status}`;

      throw new ApiError(message, response.status, payload);
    }

    return payload as T;
  }

  register(input: RegisterRequest) {
    return this.request<AuthSessionResponse>("/api/v1/auth/register", {
      method: "POST",
      body: input,
    });
  }

  login(input: LoginRequest) {
    return this.request<AuthSessionResponse>("/api/v1/auth/login", {
      method: "POST",
      body: input,
    });
  }

  refresh(options: { signal?: AbortSignal } = {}) {
    return this.request<AuthSessionResponse>("/api/v1/auth/refresh", {
      method: "POST",
      signal: options.signal,
    });
  }

  logout() {
    return this.request<void>("/api/v1/auth/logout", {
      method: "POST",
      body: {},
    });
  }

  forgotPassword(input: ForgotPasswordRequest) {
    return this.request<void>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: input,
    });
  }

  resetPassword(input: ResetPasswordRequest) {
    return this.request<void>("/api/v1/auth/reset-password", {
      method: "POST",
      body: input,
    });
  }

  getMyWorkspaces() {
    return this.request<AuthSessionResponse["workspaces"]>("/api/v1/users/me/workspaces");
  }

  getCurrentUser() {
    return this.request<AuthUser>("/api/v1/users/me");
  }

  updateCurrentUser(input: UpdateProfileRequest) {
    return this.request<AuthUser>("/api/v1/users/me", {
      method: "PUT",
      body: input,
    });
  }

  listTasks(params: {
    projectId?: string;
    sprintId?: string;
    assigneeId?: string;
    status?: string;
    priority?: string;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    return this.request<TaskResponse[]>(withQuery("/api/v1/tasks", params));
  }

  getTask(taskId: string) {
    return this.request<TaskResponse>(`/api/v1/tasks/${taskId}`);
  }

  createTask(input: CreateTaskRequest) {
    return this.request<CreatedTaskResponse>("/api/v1/tasks", {
      method: "POST",
      body: input,
    });
  }

  updateTask(taskId: string, input: UpdateTaskRequest) {
    return this.request<{ id: string }>(`/api/v1/tasks/${taskId}`, {
      method: "PUT",
      body: input,
    });
  }

  updateTaskStatus(taskId: string, input: UpdateTaskStatusRequest) {
    return this.request<UpdatedTaskStatusResponse>(`/api/v1/tasks/${taskId}/status`, {
      method: "PATCH",
      body: input,
    });
  }

  deleteTask(taskId: string) {
    return this.request<void>(`/api/v1/tasks/${taskId}`, {
      method: "DELETE",
    });
  }

  listProjects(params: {
    status?: string;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    return this.request<ProjectResponse[]>(withQuery("/api/v1/projects", params));
  }

  getProject(projectId: string) {
    return this.request<ProjectDetailResponse>(`/api/v1/projects/${projectId}`);
  }

  createProject(input: CreateProjectRequest) {
    return this.request<ProjectResponse>("/api/v1/projects", {
      method: "POST",
      body: input,
    });
  }

  listProjectTemplates() {
    return this.request<ProjectTemplateResponse[]>("/api/v1/projects/templates");
  }

  createProjectFromTemplate(input: CreateProjectFromTemplateRequest) {
    return this.request<ProjectResponse>("/api/v1/projects/from-template", {
      method: "POST",
      body: input,
    });
  }

  updateProject(projectId: string, input: UpdateProjectRequest) {
    return this.request<ProjectResponse>(`/api/v1/projects/${projectId}`, {
      method: "PUT",
      body: input,
    });
  }

  listGoals(params: {
    status?: string;
    type?: string;
    ownerId?: string;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    return this.request<GoalResponse[]>(withQuery("/api/v1/goals", params));
  }

  getGoal(goalId: string) {
    return this.request<GoalResponse>(`/api/v1/goals/${goalId}`);
  }

  createGoal(input: CreateGoalRequest) {
    return this.request<GoalResponse>("/api/v1/goals", {
      method: "POST",
      body: input,
    });
  }

  updateGoal(goalId: string, input: UpdateGoalRequest) {
    return this.request<{ id: string }>(`/api/v1/goals/${goalId}`, {
      method: "PUT",
      body: input,
    });
  }

  deleteGoal(goalId: string) {
    return this.request<void>(`/api/v1/goals/${goalId}`, {
      method: "DELETE",
    });
  }

  linkGoalProject(goalId: string, input: LinkProjectRequest) {
    return this.request<GoalProjectLinkResponse>(`/api/v1/goals/${goalId}/projects`, {
      method: "POST",
      body: input,
    });
  }

  createGoalInitiative(goalId: string, input: CreateInitiativeRequest) {
    return this.request<InitiativeResponse>(`/api/v1/goals/${goalId}/initiatives`, {
      method: "POST",
      body: input,
    });
  }

  updateGoalInitiative(goalId: string, initiativeId: string, input: UpdateInitiativeRequest) {
    return this.request<{ id: string }>(`/api/v1/goals/${goalId}/initiatives/${initiativeId}`, {
      method: "PUT",
      body: input,
    });
  }

  deleteGoalInitiative(goalId: string, initiativeId: string) {
    return this.request<void>(`/api/v1/goals/${goalId}/initiatives/${initiativeId}`, {
      method: "DELETE",
    });
  }

  unlinkGoalProject(goalId: string, projectId: string) {
    return this.request<void>(`/api/v1/goals/${goalId}/projects/${projectId}`, {
      method: "DELETE",
    });
  }

  listCalendarItems(params: {
    start: string;
    end: string;
  }) {
    return this.request<CalendarItemResponse[]>(withQuery("/api/v1/calendar", params));
  }

  getCalendarItem(calendarItemId: string) {
    return this.request<CalendarItemResponse>(`/api/v1/calendar/${calendarItemId}`);
  }

  createCalendarItem(input: CreateCalendarItemRequest) {
    return this.request<CalendarItemResponse>("/api/v1/calendar", {
      method: "POST",
      body: input,
    });
  }

  updateCalendarItem(calendarItemId: string, input: UpdateCalendarItemRequest) {
    return this.request<CalendarItemResponse>(`/api/v1/calendar/${calendarItemId}`, {
      method: "PUT",
      body: input,
    });
  }

  deleteCalendarItem(calendarItemId: string) {
    return this.request<void>(`/api/v1/calendar/${calendarItemId}`, {
      method: "DELETE",
    });
  }

  listDocuments(params: {
    projectId?: string;
    isPublished?: boolean;
    parentDocumentId?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    return this.request<DocumentResponse[]>(withQuery("/api/v1/documents", params));
  }

  listProjectDocuments(
    projectId: string,
    params: {
      isPublished?: boolean;
      parentDocumentId?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    return this.request<DocumentResponse[]>(
      withQuery(`/api/v1/projects/${projectId}/documents`, params),
    );
  }

  getDocument(documentId: string) {
    return this.request<DocumentResponse>(`/api/v1/documents/${documentId}`);
  }

  createDocument(input: CreateDocumentRequest) {
    return this.request<DocumentResponse>("/api/v1/documents", {
      method: "POST",
      body: input,
    });
  }

  updateDocument(documentId: string, input: UpdateDocumentRequest) {
    return this.request<DocumentResponse>(`/api/v1/documents/${documentId}`, {
      method: "PUT",
      body: input,
    });
  }

  deleteDocument(documentId: string) {
    return this.request<void>(`/api/v1/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  listSprints(projectId: string, params: { status?: string } = {}) {
    return this.request<SprintResponse[]>(
      withQuery(`/api/v1/projects/${projectId}/sprints`, params),
    );
  }

  getSprint(sprintId: string) {
    return this.request<SprintResponse>(`/api/v1/sprints/${sprintId}`);
  }

  createSprint(projectId: string, input: CreateSprintRequest) {
    return this.request<SprintResponse>(`/api/v1/projects/${projectId}/sprints`, {
      method: "POST",
      body: input,
    });
  }

  updateSprint(sprintId: string, input: UpdateSprintRequest) {
    return this.request<SprintResponse>(`/api/v1/sprints/${sprintId}`, {
      method: "PUT",
      body: input,
    });
  }

  startSprint(sprintId: string) {
    return this.request<SprintTransitionResponse>(`/api/v1/sprints/${sprintId}/start`, {
      method: "POST",
      body: {},
    });
  }

  completeSprint(sprintId: string) {
    return this.request<SprintTransitionResponse>(`/api/v1/sprints/${sprintId}/complete`, {
      method: "POST",
      body: {},
    });
  }

  deleteSprint(sprintId: string) {
    return this.request<void>(`/api/v1/sprints/${sprintId}`, {
      method: "DELETE",
    });
  }

  toggleProjectFavorite(projectId: string) {
    return this.request<FavoriteToggleResponse>(`/api/v1/projects/${projectId}/favorite`, {
      method: "POST",
      body: {},
    });
  }

  listNotifications(params: {
    isRead?: boolean;
    isArchived?: boolean;
    type?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    return this.request<NotificationResponse[]>(withQuery("/api/v1/notifications", params));
  }

  markNotificationRead(notificationId: string) {
    return this.request<NotificationResponse>(`/api/v1/notifications/${notificationId}/read`, {
      method: "PUT",
      body: {},
    });
  }

  markAllNotificationsRead() {
    return this.request<MarkAllReadResponse>("/api/v1/notifications/read-all", {
      method: "PUT",
      body: {},
    });
  }

  archiveNotification(notificationId: string) {
    return this.request<NotificationResponse>(`/api/v1/notifications/${notificationId}/archive`, {
      method: "PUT",
      body: {},
    });
  }

  getWorkload(params: { projectId?: string } = {}) {
    return this.request<WorkloadResponse>(withQuery("/api/v1/analytics/workload", params));
  }

  getVelocity(params: { projectId?: string; sprintCount?: number } = {}) {
    return this.request<VelocityResponse>(withQuery("/api/v1/analytics/velocity", params));
  }

  getBurndown(params: { sprintId: string }) {
    return this.request<BurndownResponse>(withQuery("/api/v1/analytics/burndown", params));
  }

  exportAnalyticsReport(params: {
    format?: string;
    reportType?: AnalyticsReportType;
    projectId?: string;
  } = {}) {
    return this.request<string>(withQuery("/api/v1/analytics/export", params));
  }

  listTimeEntries(params: {
    userId?: string;
    taskId?: string;
    projectId?: string;
    startedAfter?: string;
    startedBefore?: string;
    isBillable?: boolean;
  } = {}) {
    return this.request<TimeEntryResponse[]>(withQuery("/api/v1/time-entries", params));
  }

  createTimeEntry(input: CreateTimeEntryRequest) {
    return this.request<TimeEntryResponse>("/api/v1/time-entries", {
      method: "POST",
      body: input,
    });
  }

  updateTimeEntry(timeEntryId: string, input: UpdateTimeEntryRequest) {
    return this.request<TimeEntryResponse>(`/api/v1/time-entries/${timeEntryId}`, {
      method: "PUT",
      body: input,
    });
  }

  deleteTimeEntry(timeEntryId: string) {
    return this.request<void>(`/api/v1/time-entries/${timeEntryId}`, {
      method: "DELETE",
    });
  }

  startTimer(input: StartTimerRequest) {
    return this.request<TimeEntryResponse>("/api/v1/time-entries/start", {
      method: "POST",
      body: input,
    });
  }

  stopTimer(timeEntryId: string) {
    return this.request<TimeEntryResponse>(`/api/v1/time-entries/${timeEntryId}/stop`, {
      method: "POST",
      body: {},
    });
  }

  listRequestForms(params: {
    isActive?: boolean;
  } = {}) {
    return this.request<IntakeFormResponse[]>(withQuery("/api/v1/request-forms", params));
  }

  listIntakeSubmissions(params: {
    requestFormId?: string;
    status?: string;
  } = {}) {
    return this.request<IntakeSubmissionResponse[]>(withQuery("/api/v1/intake/submissions", params));
  }

  submitIntakeRequest(formSlug: string, input: SubmitIntakeRequest) {
    return this.request<IntakeSubmissionResponse>(`/api/v1/intake/${formSlug}/submit`, {
      method: "POST",
      body: input,
    });
  }

  reviewIntakeSubmission(submissionId: string, input: IntakeReviewSubmissionRequest) {
    return this.request<IntakeSubmissionResponse>(`/api/v1/intake/submissions/${submissionId}/review`, {
      method: "PUT",
      body: input,
    });
  }

  convertIntakeSubmissionToTask(submissionId: string, input: IntakeConvertToTaskRequest) {
    return this.request<IntakeConvertToTaskResponse>(`/api/v1/intake/submissions/${submissionId}/convert-to-task`, {
      method: "POST",
      body: input,
    });
  }

  createWorkspace(input: CreateWorkspaceRequest) {
    return this.request<WorkspaceResponse>("/api/v1/workspaces", {
      method: "POST",
      body: input,
    });
  }

  getWorkspace(workspaceId: string) {
    return this.request<WorkspaceResponse>(`/api/v1/workspaces/${workspaceId}`);
  }

  updateWorkspace(workspaceId: string, input: UpdateWorkspaceRequest) {
    return this.request<WorkspaceResponse>(`/api/v1/workspaces/${workspaceId}`, {
      method: "PUT",
      body: input,
    });
  }

  getWorkspaceSettings(workspaceId: string) {
    return this.request<WorkspaceSettingsResponse>(`/api/v1/workspaces/${workspaceId}/settings`);
  }

  updateWorkspaceSettings(workspaceId: string, input: UpdateWorkspaceSettingsRequest) {
    return this.request<{ id: string; settings: Record<string, unknown> }>(
      `/api/v1/workspaces/${workspaceId}/settings`,
      {
        method: "PUT",
        body: input,
      },
    );
  }

  listWorkspaceMembers(workspaceId: string) {
    return this.request<WorkspaceMemberResponse[]>(`/api/v1/workspaces/${workspaceId}/members`);
  }

  updateWorkspaceMemberRole(workspaceId: string, userId: string, role: WorkspaceMemberResponse["role"]) {
    return this.request<WorkspaceMemberResponse>(`/api/v1/workspaces/${workspaceId}/members/${userId}`, {
      method: "PUT",
      body: { role },
    });
  }

  removeWorkspaceMember(workspaceId: string, userId: string) {
    return this.request<void>(`/api/v1/workspaces/${workspaceId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  inviteWorkspaceMember(workspaceId: string, input: InviteWorkspaceMemberRequest) {
    return this.request<{ id: string }>(`/api/v1/workspaces/${workspaceId}/invitations`, {
      method: "POST",
      body: input,
    });
  }

  getNotificationPreferences() {
    return this.request<NotificationPreferenceResponse[]>("/api/v1/notifications/preferences");
  }

  updateNotificationPreferences(input: UpdateNotificationPreferencesRequest) {
    return this.request<NotificationPreferenceResponse[]>("/api/v1/notifications/preferences", {
      method: "PUT",
      body: input,
    });
  }

  setActiveWorkspace(workspaceId: string) {
    return this.request<AuthSessionResponse>("/api/v1/users/me/active-workspace", {
      method: "PUT",
      body: { workspaceId },
    });
  }

  getInvitation(token: string) {
    return this.request<InvitationDetailsResponse>(`/api/v1/invitations/${token}`);
  }

  acceptInvitation(token: string) {
    return this.request<AuthSessionResponse>(`/api/v1/invitations/${token}/accept`, {
      method: "POST",
    });
  }

  // ─── Task Comments ────────────────────────────────────────────────────────

  listTaskComments(taskId: string) {
    return this.request<TaskCommentResponse[]>(`/api/v1/tasks/${taskId}/comments`);
  }

  createTaskComment(taskId: string, input: CreateTaskCommentRequest) {
    return this.request<TaskCommentResponse>(`/api/v1/tasks/${taskId}/comments`, {
      method: "POST",
      body: {
        body: input.content,
        parentCommentId: null,
      },
    });
  }

  deleteTaskComment(taskId: string, commentId: string) {
    return this.request<void>(`/api/v1/tasks/${taskId}/comments/${commentId}`, {
      method: "DELETE",
    });
  }

  // ─── Task Checklist ───────────────────────────────────────────────────────

  listTaskChecklist(taskId: string) {
    return this.request<TaskChecklistItemResponse[]>(`/api/v1/tasks/${taskId}/checklist`);
  }

  createTaskChecklistItem(taskId: string, input: CreateChecklistItemRequest) {
    return this.request<TaskChecklistItemResponse>(`/api/v1/tasks/${taskId}/checklist`, {
      method: "POST",
      body: {
        title: input.text,
      },
    });
  }

  toggleTaskChecklistItem(taskId: string, itemId: string, input: { isCompleted: boolean }) {
    return this.request<void>(`/api/v1/tasks/${taskId}/checklist/${itemId}`, {
      method: "PATCH",
      body: input,
    });
  }

  deleteTaskChecklistItem(taskId: string, itemId: string) {
    return this.request<void>(`/api/v1/tasks/${taskId}/checklist/${itemId}`, {
      method: "DELETE",
    });
  }

  // ─── Task Watchers ────────────────────────────────────────────────────────

  listTaskWatchers(taskId: string) {
    return this.request<TaskWatcherResponse[]>(`/api/v1/tasks/${taskId}/watchers`);
  }

  addTaskWatcher(taskId: string, input: { userId: string }) {
    return this.request<void>(`/api/v1/tasks/${taskId}/watchers`, {
      method: "POST",
      body: input,
    });
  }

  removeTaskWatcher(taskId: string, userId: string) {
    return this.request<void>(`/api/v1/tasks/${taskId}/watchers/${userId}`, {
      method: "DELETE",
    });
  }

  // ─── File Attachments ─────────────────────────────────────────────────────

  listTaskAttachments(taskId: string) {
    return this.request<FileAttachmentResponse[]>(`/api/v1/tasks/${taskId}/attachments`);
  }

  uploadTaskAttachment(
    taskId: string,
    file: File,
  ) {
    return this.request<{ uploadUrl: string; attachmentId: string }>(
      `/api/v1/tasks/${taskId}/attachments/upload`,
      {
        method: "POST",
        body: {
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSizeBytes: file.size,
        },
      },
    ).then(async (response) => {
      await uploadFileToPresignedUrl(response.uploadUrl, file);
      return response;
    });
  }

  deleteTaskAttachment(taskId: string, attachmentId: string) {
    return this.request<void>(`/api/v1/tasks/${taskId}/attachments/${attachmentId}`, {
      method: "DELETE",
    });
  }

  // ─── AI Copilot ───────────────────────────────────────────────────────────

  listAIConversations() {
    return this.request<AIConversationResponse[]>("/api/v1/ai/conversations");
  }

  createAIConversation(input: CreateAIConversationRequest = {}) {
    return this.request<AIConversationResponse>("/api/v1/ai/conversations", {
      method: "POST",
      body: input,
    });
  }

  getAIConversation(id: string) {
    return this.request<AIConversationWithMessagesResponse>(`/api/v1/ai/conversations/${id}`);
  }

  sendAIMessage(conversationId: string, input: SendAIMessageRequest) {
    return this.request<AIMessageResponse>(`/api/v1/ai/conversations/${conversationId}/messages`, {
      method: "POST",
      body: input,
    });
  }

  deleteAIConversation(id: string) {
    return this.request<void>(`/api/v1/ai/conversations/${id}`, {
      method: "DELETE",
    });
  }

  getAIProviderSettings() {
    return this.request<AIProviderSettingsResponse>("/api/v1/ai/provider");
  }

  updateAIProviderSettings(input: UpdateAIProviderSettingsRequest) {
    return this.request<AIProviderSettingsResponse>("/api/v1/ai/provider", {
      method: "PUT",
      body: input,
    });
  }

  deleteAIProviderSettings() {
    return this.request<void>("/api/v1/ai/provider", {
      method: "DELETE",
    });
  }
}

export function createApiClient(options: ApiClientOptions = {}) {
  return new LinearPrecisionApiClient(options);
}
