// === Base Types ===

export interface User {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  email?: string;
  role?: string;
  jobTitle?: string;
}

// === Status Enums ===

export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';
export type ProjectStatus = 'Planning' | 'In Progress' | 'Paused' | 'Completed';
export type InitiativeStatus = 'Planning' | 'Active' | 'Paused' | 'Completed';
export type GoalStatus = 'on-track' | 'at-risk' | 'off-track' | 'completed' | 'not-started';
export type HealthStatus = 'On Track' | 'At Risk' | 'Off Track';
export type ItemStatus = 'planned' | 'in-progress' | 'completed' | 'at-risk';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ExtendedPriority = 'Low' | 'Medium' | 'High' | 'Critical';

// === Common Interfaces ===

export interface AuditFields {
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface LinkedProject {
  id: string;
  name: string;
  status: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt?: string;
  parentId?: string; // for threading
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: User;
  uploadedAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'created' | 'updated' | 'commented' | 'assigned' | 'status_changed' | 'completed' | 'mentioned';
  description: string;
  actor: User;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Budget {
  allocated: number;
  spent: number;
  status: 'Under' | 'On Budget' | 'Over';
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

// === Pagination ===

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// === Filtering ===

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterState {
  search: string;
  status: string[];
  priority: string[];
  assignee: string[];
  dateRange?: { start: string; end: string };
  tags: string[];
}

// === API Response Wrappers ===

export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, string[]>;
}

// === Notification Types ===

export type NotificationType = 
  | 'task_assigned'
  | 'task_completed'
  | 'comment_added'
  | 'mention'
  | 'due_date_approaching'
  | 'status_changed'
  | 'project_update'
  | 'sprint_started'
  | 'sprint_completed';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actor?: User;
  actionUrl?: string;
}

// === Role & Permissions ===

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

// === Workspace ===

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  projectCount: number;
  plan: 'free' | 'pro' | 'enterprise';
}

// === Date Ranges ===

export type DatePreset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'custom';

export interface DateRange {
  start: string;
  end: string;
  preset?: DatePreset;
}
