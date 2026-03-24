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
