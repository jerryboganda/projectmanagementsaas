import type { IssueRowData } from '../ui';
import type { ProjectResponse, TaskResponse } from '../api/client';

/**
 * Map backend TaskResponse -> the mobile IssueRow view model.
 * The backend status is an enum serialized as either a string
 * ("Todo" / "InProgress" / "Done" / ...) or an integer; we
 * normalize both shapes.
 */
export function taskToIssueRow(task: TaskResponse): IssueRowData {
  return {
    id: task.identifier,
    title: task.title,
    priority: mapPriority(task.priority),
    status: mapStatus(task.status),
    dateLabel: task.dueDate ? formatShortDate(task.dueDate) : undefined,
    overdueLabel: isOverdue(task) ? `${daysOverdue(task)}d Overdue` : undefined,
    timeAgo: relativeTime(task.updatedAt),
    assignee: task.assignee ? { initials: initialsOf(task.assignee.fullName) } : undefined,
  };
}

export interface ProjectCardVM {
  id: string;
  key: string;
  name: string;
  status: string;
  progress: number;
  members: number;
  due: string;
}

export function projectToCard(project: ProjectResponse): ProjectCardVM {
  const total = project.taskCount || 0;
  const progress = total === 0 ? 0 : Math.round((project.completedTaskCount / total) * 100);
  return {
    id: project.id,
    key: project.identifier.slice(0, 4).toUpperCase(),
    name: project.name,
    status: humanStatus(project.status),
    progress,
    members: 0, // member count requires detail fetch; omitted on list
    due: project.targetDate ? formatShortDate(project.targetDate) : '—',
  };
}

function mapStatus(value: TaskResponse['status']): IssueRowData['status'] {
  const s = typeof value === 'number' ? enumToStatus(value) : value;
  switch (s) {
    case 'Done':
    case 'Cancelled':
      return 'done';
    case 'InProgress':
    case 'InReview':
      return 'in-progress';
    default:
      return 'open';
  }
}

function enumToStatus(n: number): string {
  return ['Backlog', 'Todo', 'InProgress', 'InReview', 'Done', 'Cancelled'][n] ?? 'Todo';
}

function mapPriority(value: TaskResponse['priority']): IssueRowData['priority'] {
  const p =
    typeof value === 'number'
      ? (['None', 'Low', 'Medium', 'High', 'Urgent'][value] ?? 'Medium')
      : value;
  if (p === 'Urgent' || p === 'High') return 'high';
  if (p === 'Medium') return 'medium';
  return 'low';
}

function humanStatus(value: ProjectResponse['status']): string {
  const s =
    typeof value === 'number'
      ? (['Active', 'Paused', 'Completed', 'Archived'][value] ?? 'Active')
      : value;
  if (s === 'Active') return 'On Track';
  if (s === 'Paused') return 'At Risk';
  if (s === 'Archived') return 'Blocked';
  if (s === 'Completed') return 'Done';
  return String(s);
}

function isOverdue(task: TaskResponse): boolean {
  if (!task.dueDate) return false;
  const mapped = mapStatus(task.status);
  if (mapped === 'done') return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

function daysOverdue(task: TaskResponse): number {
  if (!task.dueDate) return 0;
  return Math.max(1, Math.floor((Date.now() - new Date(task.dueDate).getTime()) / 86_400_000));
}

export function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return `${Math.floor(days / 30)}mo`;
}
