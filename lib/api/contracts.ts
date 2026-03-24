export type WorkspaceRole = "Owner" | "Admin" | "Member" | "Guest" | number;
export type TaskStatus =
  | "Backlog"
  | "Todo"
  | "InProgress"
  | "InReview"
  | "Done"
  | "Cancelled"
  | number;
export type TaskPriority = "None" | "Low" | "Medium" | "High" | "Urgent" | number;
export type ProjectStatus = "Active" | "Paused" | "Completed" | "Archived" | number;
export type ProjectVisibility = "Workspace" | "Private" | "Public" | number;
export type GoalStatus = "OnTrack" | "AtRisk" | "OffTrack" | "Completed" | "Cancelled" | number;
export type GoalType = "Objective" | "KeyResult" | number;
export type GoalProgressSource = "Manual" | "LinkedProjects" | "LinkedTasks" | number;
export type InitiativeStatus = "Planned" | "InProgress" | "Completed" | "Cancelled" | number;

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

export interface PersistedAuthSession {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
  user: AuthUser;
  activeWorkspaceId?: string | null;
  workspaces: AuthWorkspace[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string | null;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  domain?: string | null;
  currentUserRole?: WorkspaceRole | null;
  memberCount: number;
  createdAt: string;
}

export interface UpdateWorkspaceRequest {
  name?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  domain?: string | null;
}

export interface WorkspaceSettingsResponse {
  workspaceId: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  domain?: string | null;
  currentUserRole?: WorkspaceRole | null;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: string;
}

export interface UpdateWorkspaceSettingsRequest {
  settings: Record<string, unknown>;
}

export interface WorkspaceMemberResponse {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: WorkspaceRole;
  isActive: boolean;
  joinedAt?: string | null;
}

export interface InviteWorkspaceMemberRequest {
  email: string;
  role: WorkspaceRole;
  projectIds?: string[] | null;
}

export type InvitationStatus =
  | "Pending"
  | "Accepted"
  | "Declined"
  | "Expired"
  | "Revoked";

export interface InvitationDetailsResponse {
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  expiresAt: string;
}

export interface ApiUserBrief {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
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

export type CalendarItemType =
  | "Event"
  | "Milestone"
  | "Deadline"
  | "Meeting"
  | "Reminder"
  | number;

export interface CalendarItemResponse {
  id: string;
  title: string;
  description?: string | null;
  type: CalendarItemType;
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

export interface CreateCalendarItemRequest {
  title: string;
  description?: string | null;
  type: CalendarItemType;
  color?: string | null;
  startTime: string;
  endTime: string;
  isAllDay?: boolean | null;
  recurrenceRule?: string | null;
  linkedTaskId?: string | null;
  linkedProjectId?: string | null;
}

export interface UpdateCalendarItemRequest {
  title: string;
  description?: string | null;
  type: CalendarItemType;
  color?: string | null;
  startTime: string;
  endTime: string;
  isAllDay?: boolean | null;
  recurrenceRule?: string | null;
  linkedTaskId?: string | null;
  linkedProjectId?: string | null;
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
  childDocuments?: DocumentResponse[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequest {
  title: string;
  content?: string | null;
  contentFormat?: string | null;
  projectId?: string | null;
  parentDocumentId?: string | null;
  isPublished?: boolean | null;
  sortOrder?: number | null;
}

export interface UpdateDocumentRequest {
  title: string;
  content?: string | null;
  contentFormat?: string | null;
  projectId?: string | null;
  parentDocumentId?: string | null;
  isPublished?: boolean | null;
  sortOrder?: number | null;
}

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

export interface NotificationPreferenceResponse {
  id: string;
  eventType: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export interface NotificationPreferenceItem {
  eventType: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  preferences: NotificationPreferenceItem[];
}

export interface MarkAllReadResponse {
  updatedCount: number;
}

export interface UpdateProfileRequest {
  fullName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  timezone?: string | null;
  locale?: string | null;
  jobTitle?: string | null;
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

export type IntakeFieldType =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "priority"
  | "assignee";

export interface IntakeFieldSchema {
  id: string;
  type: IntakeFieldType;
  label: string;
  required: boolean;
  options?: string[] | null;
}

export interface IntakeFormSchema {
  fields: IntakeFieldSchema[];
  autoAssigneeId?: string | null;
}

export interface IntakeFormResponse {
  id: string;
  title: string;
  description?: string | null;
  slug: string;
  isActive: boolean;
  isPublic: boolean;
  formSchema: IntakeFormSchema | Record<string, unknown>;
  defaultProjectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type IntakeSubmissionStatus =
  | "New"
  | "InReview"
  | "Accepted"
  | "Rejected"
  | "ConvertedToTask"
  | number;

export interface IntakeSubmissionResponse {
  id: string;
  requestFormId: string;
  data: Record<string, unknown>;
  status: IntakeSubmissionStatus;
  submitterEmail?: string | null;
  submitterUserId?: string | null;
  convertedToTaskId?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}

export interface SubmitIntakeRequest {
  data: Record<string, unknown>;
  submitterEmail?: string | null;
  submitterName?: string | null;
}

export interface IntakeReviewSubmissionRequest {
  status: IntakeSubmissionStatus;
  reviewNotes?: string | null;
}

export interface IntakeConvertToTaskRequest {
  projectId: string;
  title?: string | null;
  priority?: TaskPriority | null;
  assigneeId?: string | null;
}

export interface IntakeConvertToTaskResponse {
  taskId: string;
  identifier: string;
  title: string;
}
