import type {
  CreateTaskRequest,
  TaskPriority,
  TaskResponse,
  TaskStatus,
  UpdateTaskRequest,
  WorkspaceMemberResponse,
} from '@/lib/api/contracts';

export type BoardTaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';
export type BoardTaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
type BoardTaskType = 'task' | 'bug' | 'story' | 'feature' | 'epic';

export interface BoardUser {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  email?: string;
  role?: string;
}

export interface BoardTask {
  id: string;
  identifier: string;
  title: string;
  description: string;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  type: BoardTaskType;
  assigneeId?: string;
  projectId: string;
  dueDate?: string;
  tags: string[];
  attachmentCount: number;
  commentCount: number;
  checklistTotal: number;
  checklistCompleted: number;
  watcherCount: number;
  createdAt: string;
  updatedAt: string;
  rawStatus: TaskStatus;
}

export const BOARD_STATUSES: BoardTaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
export const BOARD_PRIORITIES: BoardTaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

function toInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function normalizeTaskStatus(status: TaskStatus): BoardTaskStatus | null {
  if (status === 'Done' || status === 4) return 'Done';
  if (status === 'InReview' || status === 3) return 'In Review';
  if (status === 'InProgress' || status === 2) return 'In Progress';
  if (status === 'Backlog' || status === 0 || status === 'Todo' || status === 1) return 'To Do';
  return null;
}

export function normalizeTaskPriority(priority: TaskPriority): BoardTaskPriority {
  if (priority === 'Urgent' || priority === 4) return 'Urgent';
  if (priority === 'High' || priority === 3) return 'High';
  if (priority === 'Medium' || priority === 2) return 'Medium';
  return 'Low';
}

export function denormalizeTaskStatus(status: BoardTaskStatus): TaskStatus {
  if (status === 'In Progress') return 'InProgress';
  if (status === 'In Review') return 'InReview';
  if (status === 'Done') return 'Done';
  return 'Todo';
}

export function denormalizeTaskPriority(priority: BoardTaskPriority): TaskPriority {
  if (priority === 'Urgent') return 'Urgent';
  if (priority === 'High') return 'High';
  if (priority === 'Medium') return 'Medium';
  return 'Low';
}

export function toBoardUser(member: WorkspaceMemberResponse): BoardUser | null {
  if (!member.isActive) {
    return null;
  }

  return {
    id: member.userId,
    name: member.fullName,
    initials: toInitials(member.fullName),
    avatar: member.avatarUrl ?? undefined,
    email: member.email,
    role: typeof member.role === 'number' ? String(member.role) : member.role,
  };
}

export function toBoardTask(task: TaskResponse): BoardTask | null {
  const status = normalizeTaskStatus(task.status);
  if (!status) {
    return null;
  }

  return {
    id: task.id,
    identifier: task.identifier,
    title: task.title,
    description: task.description ?? '',
    status,
    priority: normalizeTaskPriority(task.priority),
    type: (task.taskType ?? 'task') as BoardTaskType,
    assigneeId: task.assignee?.id ?? undefined,
    projectId: task.projectId,
    dueDate: task.dueDate ?? undefined,
    tags: task.labels,
    attachmentCount: task.attachmentCount,
    commentCount: task.commentCount,
    checklistTotal: task.checklistTotal,
    checklistCompleted: task.checklistCompleted,
    watcherCount: task.watcherCount,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    rawStatus: task.status,
  };
}

export function toCreateTaskRequest(task: {
  projectId: string;
  title: string;
  description?: string;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  assigneeId?: string;
  dueDate?: string;
  tags: string[];
}): CreateTaskRequest {
  return {
    projectId: task.projectId,
    title: task.title,
    description: task.description || null,
    status: denormalizeTaskStatus(task.status),
    priority: denormalizeTaskPriority(task.priority),
    taskType: 'task',
    labels: task.tags,
    assigneeId: task.assigneeId ?? null,
    dueDate: task.dueDate ?? null,
  };
}

export function toUpdateTaskRequest(task: BoardTask): UpdateTaskRequest {
  return {
    title: task.title,
    description: task.description || null,
    status: denormalizeTaskStatus(task.status),
    priority: denormalizeTaskPriority(task.priority),
    taskType: task.type,
    labels: task.tags,
    assigneeId: task.assigneeId ?? null,
    parentTaskId: null,
    sprintId: null,
    startDate: null,
    dueDate: task.dueDate ?? null,
    estimatePoints: null,
    estimateHours: null,
    sortOrder: null,
    customFields: null,
  };
}
