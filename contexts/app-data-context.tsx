"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

// ============================================================
// UNIFIED TYPE SYSTEM
// ============================================================

export interface User {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  email?: string;
  role?: "owner" | "admin" | "member" | "guest";
  jobTitle?: string;
  department?: string;
}

export type TaskStatus = "To Do" | "In Progress" | "In Review" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type TaskType = "task" | "bug" | "story" | "feature" | "epic";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  parentId?: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  date: string;
  hours: number;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assigneeId?: string;
  watcherIds: string[];
  projectId?: string;
  sprintId?: string;
  dueDate?: string;
  startDate?: string;
  tags: string[];
  subtasks: Subtask[];
  checklist: ChecklistItem[];
  comments: Comment[];
  attachmentCount: number;
  dependencies: string[];
  isBlocked?: boolean;
  isRecurring?: boolean;
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = "Planning" | "In Progress" | "Paused" | "Completed";
export type ProjectHealth = "On Track" | "At Risk" | "Off Track";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  health: ProjectHealth;
  progress: number;
  ownerId: string;
  teamIds: string[];
  dueDate: string;
  startDate?: string;
  tags: string[];
  isFavorite: boolean;
  color?: string;
  icon?: string;
  lastUpdated: string;
}

export type GoalType = "Company Goal" | "Objective" | "Key Result";
export type GoalStatus = "on-track" | "at-risk" | "off-track" | "completed" | "not-started";

export interface GoalItem {
  id: string;
  title: string;
  type: GoalType;
  status: GoalStatus;
  confidence: "High" | "Medium" | "Low";
  progress: number;
  ownerId: string;
  team: string;
  cycle: string;
  targetMetric?: string;
  currentMetric?: string;
  dueDate: string;
  linkedProjectIds: string[];
  parentId?: string;
  childIds: string[];
  description?: string;
}

export type InitiativeStatus = "Planning" | "Active" | "Paused" | "Completed";
export type InitiativeHealth = "On Track" | "At Risk" | "Off Track";

export interface Initiative {
  id: string;
  name: string;
  description: string;
  status: InitiativeStatus;
  health: InitiativeHealth;
  progress: number;
  ownerId: string;
  department: string;
  startDate: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  budget: { allocated: number; spent: number; status: "Under" | "On Budget" | "Over" };
  milestones: { total: number; completed: number };
  risks: number;
  tags: string[];
  lastUpdated: string;
  linkedProjectIds: string[];
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "completed";
  goalDescription?: string;
}

export type AutomationTrigger =
  | "status_changed"
  | "assignee_changed"
  | "due_date_passed"
  | "new_task_created"
  | "task_completed"
  | "priority_changed"
  | "comment_added";

export type AutomationAction =
  | "set_status"
  | "assign_to"
  | "send_notification"
  | "move_to_project"
  | "add_tag"
  | "set_priority"
  | "create_subtask";

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: AutomationTrigger;
    conditions?: Record<string, string>;
  };
  actions: {
    type: AutomationAction;
    config: Record<string, string>;
  }[];
  enabled: boolean;
  projectId?: string;
  lastTriggered?: string;
  triggerCount: number;
}

export interface RequestForm {
  id: string;
  name: string;
  description: string;
  fields: {
    id: string;
    type: "text" | "textarea" | "select" | "date" | "priority" | "assignee";
    label: string;
    required: boolean;
    options?: string[];
  }[];
  projectId?: string;
  autoAssigneeId?: string;
  isPublic: boolean;
  submissionCount: number;
}

export interface RequestSubmission {
  id: string;
  formId: string;
  values: Record<string, string>;
  status: "pending" | "approved" | "rejected" | "converted";
  submittedAt: string;
  submittedBy: string;
  convertedTaskId?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  taskTemplates: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    subtasks: string[];
    tags: string[];
  }[];
}

export interface DocItem {
  id: string;
  title: string;
  type: "folder" | "document";
  parentId?: string;
  content?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  isFavorite?: boolean;
}

// Calendar entities
export type CalendarItemType = "task" | "milestone" | "event";
export type CalendarItemStatus = "planned" | "in-progress" | "completed" | "at-risk";
export type CalendarItemPriority = "Low" | "Medium" | "High" | "Urgent";

export interface CalendarItem {
  id: string;
  title: string;
  type: CalendarItemType;
  status: CalendarItemStatus;
  priority: CalendarItemPriority;
  startDate: string;
  endDate: string;
  assigneeId?: string;
  projectId?: string;
  progress: number;
  dependencies?: string[];
  description?: string;
  tags?: string[];
}

// ============================================================
// MOCK DATA
// ============================================================

const USERS: Record<string, User> = {
  u1: { id: "u1", name: "Alex Morgan", initials: "AM", avatar: "https://picsum.photos/seed/alex/100/100", email: "alex@linearprecision.com", role: "owner", jobTitle: "CEO", department: "Executive" },
  u2: { id: "u2", name: "Sarah Jenkins", initials: "SJ", avatar: "https://picsum.photos/seed/sarah/100/100", email: "sarah@linearprecision.com", role: "admin", jobTitle: "VP Engineering", department: "Engineering" },
  u3: { id: "u3", name: "Marcus Chen", initials: "MC", avatar: "https://picsum.photos/seed/marcus/100/100", email: "marcus@linearprecision.com", role: "member", jobTitle: "Senior Developer", department: "Engineering" },
  u4: { id: "u4", name: "Elena Rodriguez", initials: "ER", email: "elena@linearprecision.com", role: "member", jobTitle: "Product Designer", department: "Design" },
  u5: { id: "u5", name: "David Kim", initials: "DK", avatar: "https://picsum.photos/seed/david/100/100", email: "david@linearprecision.com", role: "member", jobTitle: "DevOps Lead", department: "Infrastructure" },
  u6: { id: "u6", name: "James Wilson", initials: "JW", email: "james@linearprecision.com", role: "member", jobTitle: "Security Engineer", department: "Security" },
  u7: { id: "u7", name: "Emily Davis", initials: "ED", avatar: "https://picsum.photos/seed/emily/100/100", email: "emily@linearprecision.com", role: "member", jobTitle: "Marketing Manager", department: "Marketing" },
};

const now = new Date();
const isoNow = now.toISOString();
const daysFromNow = (d: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + d);
  return date.toISOString().split("T")[0];
};

const PROJECTS: Record<string, Project> = {
  "PRJ-101": { id: "PRJ-101", name: "Website Redesign 2026", description: "Complete overhaul of the marketing website with new branding and improved conversion funnels.", status: "In Progress", health: "On Track", progress: 65, ownerId: "u1", teamIds: ["u2", "u3", "u4"], dueDate: "2026-04-15", startDate: "2026-01-10", tags: ["Marketing", "Design", "Web"], isFavorite: true, lastUpdated: isoNow },
  "PRJ-102": { id: "PRJ-102", name: "Mobile App V3 Launch", description: "Major release including dark mode, offline support, and performance improvements.", status: "In Progress", health: "At Risk", progress: 42, ownerId: "u2", teamIds: ["u1", "u3"], dueDate: "2026-05-01", startDate: "2026-02-01", tags: ["Engineering", "Mobile", "Release"], isFavorite: true, lastUpdated: isoNow },
  "PRJ-103": { id: "PRJ-103", name: "Q2 Marketing Campaign", description: "Multi-channel campaign targeting enterprise customers in the EMEA region.", status: "Planning", health: "On Track", progress: 10, ownerId: "u7", teamIds: ["u1", "u4"], dueDate: "2026-06-30", tags: ["Marketing", "Campaign"], isFavorite: false, lastUpdated: isoNow },
  "PRJ-104": { id: "PRJ-104", name: "SOC2 Compliance Audit", description: "Annual security audit and compliance certification process.", status: "In Progress", health: "On Track", progress: 85, ownerId: "u5", teamIds: ["u6"], dueDate: "2026-03-31", tags: ["Security", "Compliance", "Legal"], isFavorite: false, lastUpdated: isoNow },
  "PRJ-105": { id: "PRJ-105", name: "Customer Portal Beta", description: "Self-service portal for enterprise customers to manage their accounts.", status: "Paused", health: "Off Track", progress: 25, ownerId: "u3", teamIds: ["u1", "u4", "u5"], dueDate: "2026-07-15", tags: ["Engineering", "Customer Success"], isFavorite: false, lastUpdated: isoNow },
  "PRJ-106": { id: "PRJ-106", name: "Infrastructure Modernization", description: "Migrate core services to Kubernetes and implement zero-trust network architecture.", status: "In Progress", health: "At Risk", progress: 55, ownerId: "u5", teamIds: ["u3", "u6"], dueDate: "2026-06-30", tags: ["DevOps", "Security"], isFavorite: false, lastUpdated: isoNow },
};

const TASKS: Record<string, Task> = {
  "TSK-842": { id: "TSK-842", title: "Design system audit and token consolidation", description: "Review all current design tokens across the application and consolidate them into a single source of truth.", status: "In Progress", priority: "High", type: "task", assigneeId: "u2", watcherIds: ["u1", "u4"], projectId: "PRJ-101", dueDate: daysFromNow(2), startDate: daysFromNow(-5), tags: ["Design", "System"], subtasks: [{ id: "st-1", title: "Audit color tokens", completed: true }, { id: "st-2", title: "Audit spacing tokens", completed: true }, { id: "st-3", title: "Audit typography tokens", completed: true }, { id: "st-4", title: "Create consolidated token file", completed: false }, { id: "st-5", title: "Update component references", completed: false }], checklist: [], comments: [{ id: "c-1", content: "Found inconsistencies in the spacing scale. Need to align on 4px base unit.", authorId: "u4", createdAt: isoNow }], attachmentCount: 2, dependencies: [], createdAt: isoNow, updatedAt: isoNow },
  "TSK-843": { id: "TSK-843", title: "Implement drag and drop for Kanban board", description: "Add @hello-pangea/dnd to support smooth drag and drop interactions across columns.", status: "In Progress", priority: "Urgent", type: "feature", assigneeId: "u3", watcherIds: ["u2"], projectId: "PRJ-101", dueDate: daysFromNow(0), tags: ["Frontend", "Feature"], subtasks: [{ id: "st-6", title: "Install DnD library", completed: true }, { id: "st-7", title: "Implement column drag", completed: true }, { id: "st-8", title: "Implement card drag", completed: false }], checklist: [], comments: [], attachmentCount: 0, dependencies: [], isBlocked: true, createdAt: isoNow, updatedAt: isoNow },
  "TSK-844": { id: "TSK-844", title: "Update authentication flow copy", description: "Revise the copy on the login and signup screens to be more welcoming and clear.", status: "To Do", priority: "Medium", type: "task", assigneeId: "u4", watcherIds: [], projectId: "PRJ-102", dueDate: daysFromNow(7), tags: ["Copy", "Auth"], subtasks: [], checklist: [{ id: "cl-1", text: "Review login page copy", checked: false }, { id: "cl-2", text: "Review signup page copy", checked: false }, { id: "cl-3", text: "Get approval from marketing", checked: false }], comments: [], attachmentCount: 1, dependencies: [], createdAt: isoNow, updatedAt: isoNow },
  "TSK-845": { id: "TSK-845", title: "Database migration for user settings", description: "Migrate the user settings table to the new schema to support advanced notification preferences.", status: "To Do", priority: "High", type: "task", assigneeId: "u5", watcherIds: ["u2"], projectId: "PRJ-106", dueDate: daysFromNow(4), tags: ["Backend", "Database"], subtasks: [{ id: "st-9", title: "Write migration script", completed: false }, { id: "st-10", title: "Test on staging", completed: false }, { id: "st-11", title: "Deploy to production", completed: false }], checklist: [], comments: [], attachmentCount: 0, dependencies: [], createdAt: isoNow, updatedAt: isoNow },
  "TSK-846": { id: "TSK-846", title: "Fix navigation layout shift on mobile", description: "Investigate and fix the layout shift that occurs when opening the mobile navigation menu.", status: "In Review", priority: "Medium", type: "bug", assigneeId: "u3", watcherIds: ["u2"], projectId: "PRJ-102", dueDate: daysFromNow(1), tags: ["Bug", "Mobile"], subtasks: [{ id: "st-12", title: "Reproduce issue", completed: true }, { id: "st-13", title: "Fix CSS", completed: true }], checklist: [], comments: [{ id: "c-2", content: "Confirmed fix works on iOS Safari and Chrome Android.", authorId: "u3", createdAt: isoNow }], attachmentCount: 3, dependencies: [], createdAt: isoNow, updatedAt: isoNow },
  "TSK-847": { id: "TSK-847", title: "Q1 Performance Review Cycle", description: "Prepare and distribute Q1 performance review templates to all managers.", status: "Done", priority: "High", type: "task", assigneeId: "u2", watcherIds: ["u1"], projectId: "PRJ-101", dueDate: daysFromNow(-3), tags: ["HR", "Internal"], subtasks: [{ id: "st-14", title: "Create template", completed: true }, { id: "st-15", title: "Distribute to managers", completed: true }], checklist: [], comments: [], attachmentCount: 4, dependencies: [], createdAt: isoNow, updatedAt: isoNow },
  "TSK-848": { id: "TSK-848", title: "Setup staging environment for v2 API", description: "Provision new infrastructure for the v2 API staging environment.", status: "To Do", priority: "Low", type: "task", assigneeId: undefined, watcherIds: [], projectId: "PRJ-106", tags: ["DevOps", "API"], subtasks: [], checklist: [], comments: [], attachmentCount: 0, dependencies: ["TSK-845"], createdAt: isoNow, updatedAt: isoNow },
  "TSK-849": { id: "TSK-849", title: "Write release notes for v1.4.0", description: "Draft the release notes highlighting the new portfolio and board features.", status: "In Review", priority: "Medium", type: "task", assigneeId: "u4", watcherIds: ["u1", "u2"], projectId: "PRJ-102", dueDate: daysFromNow(3), tags: ["Content", "Release"], subtasks: [{ id: "st-16", title: "Draft notes", completed: true }, { id: "st-17", title: "Review with PM", completed: true }, { id: "st-18", title: "Format for blog", completed: false }], checklist: [], comments: [], attachmentCount: 1, dependencies: [], createdAt: isoNow, updatedAt: isoNow },
  "TSK-850": { id: "TSK-850", title: "Implement user onboarding wizard", description: "Create a guided onboarding experience for new workspace members with interactive steps.", status: "To Do", priority: "High", type: "feature", assigneeId: "u4", watcherIds: ["u1", "u2"], projectId: "PRJ-101", dueDate: daysFromNow(10), tags: ["UX", "Onboarding"], subtasks: [{ id: "st-19", title: "Design wizard flow", completed: false }, { id: "st-20", title: "Build step components", completed: false }, { id: "st-21", title: "Add completion tracking", completed: false }], checklist: [], comments: [], attachmentCount: 0, dependencies: [], createdAt: isoNow, updatedAt: isoNow },
  "TSK-851": { id: "TSK-851", title: "Add time tracking to task detail", description: "Implement time logging widget with timer and manual entry in the task detail panel.", status: "To Do", priority: "Medium", type: "feature", assigneeId: "u3", watcherIds: ["u2"], projectId: "PRJ-101", dueDate: daysFromNow(12), tags: ["Feature", "Time Tracking"], subtasks: [], checklist: [], comments: [], attachmentCount: 0, dependencies: [], estimatedHours: 16, createdAt: isoNow, updatedAt: isoNow },
  "TSK-852": { id: "TSK-852", title: "Security audit for API endpoints", description: "Review all API endpoints for proper authentication and authorization checks.", status: "In Progress", priority: "Urgent", type: "task", assigneeId: "u6", watcherIds: ["u5", "u2"], projectId: "PRJ-104", dueDate: daysFromNow(5), tags: ["Security", "API"], subtasks: [{ id: "st-22", title: "List all endpoints", completed: true }, { id: "st-23", title: "Check auth middleware", completed: false }, { id: "st-24", title: "Test with Postman", completed: false }], checklist: [], comments: [{ id: "c-3", content: "Found 3 endpoints missing auth middleware. Creating fix PRs.", authorId: "u6", createdAt: isoNow }], attachmentCount: 1, dependencies: [], createdAt: isoNow, updatedAt: isoNow },
  "TSK-853": { id: "TSK-853", title: "Design landing page hero section", description: "Create a compelling hero section for the new marketing landing page.", status: "In Progress", priority: "Medium", type: "task", assigneeId: "u4", watcherIds: ["u7"], projectId: "PRJ-103", dueDate: daysFromNow(6), tags: ["Design", "Marketing"], subtasks: [], checklist: [{ id: "cl-4", text: "Create wireframe", checked: true }, { id: "cl-5", text: "Design in Figma", checked: false }, { id: "cl-6", text: "Get stakeholder feedback", checked: false }], comments: [], attachmentCount: 0, dependencies: [], createdAt: isoNow, updatedAt: isoNow },
  "TSK-854": { id: "TSK-854", title: "Setup CI/CD pipeline for mobile app", description: "Configure automated build, test, and deployment pipeline for the mobile application.", status: "To Do", priority: "High", type: "task", assigneeId: "u5", watcherIds: ["u3"], projectId: "PRJ-102", dueDate: daysFromNow(8), tags: ["DevOps", "Mobile", "CI/CD"], subtasks: [], checklist: [], comments: [], attachmentCount: 0, dependencies: ["TSK-845"], createdAt: isoNow, updatedAt: isoNow },
};

const GOALS: Record<string, GoalItem> = {
  g1: { id: "g1", title: "Expand into Enterprise Market", type: "Company Goal", status: "on-track", confidence: "High", progress: 65, ownerId: "u1", team: "Executive", cycle: "FY 2026", dueDate: "2026-12-31", linkedProjectIds: ["PRJ-104"], parentId: undefined, childIds: ["o1-1", "o1-2"], description: "Successfully launch our enterprise offering and secure our first 10 Fortune 500 customers." },
  "o1-1": { id: "o1-1", title: "Launch Enterprise Security Features", type: "Objective", status: "on-track", confidence: "High", progress: 80, ownerId: "u6", team: "Engineering", cycle: "Q3 2026", dueDate: "2026-09-30", linkedProjectIds: ["PRJ-104"], parentId: "g1", childIds: ["kr1-1-1", "kr1-1-2"], description: undefined },
  "kr1-1-1": { id: "kr1-1-1", title: "Achieve SOC2 Type II Certification", type: "Key Result", status: "completed", confidence: "High", progress: 100, ownerId: "u6", team: "Security", cycle: "Q3 2026", dueDate: "2026-08-15", targetMetric: "1 Certification", currentMetric: "1 Certification", linkedProjectIds: [], parentId: "o1-1", childIds: [] },
  "kr1-1-2": { id: "kr1-1-2", title: "Implement SSO & SAML Integration", type: "Key Result", status: "on-track", confidence: "High", progress: 60, ownerId: "u7", team: "Core Platform", cycle: "Q3 2026", dueDate: "2026-09-30", targetMetric: "100% Rollout", currentMetric: "60% Rollout", linkedProjectIds: [], parentId: "o1-1", childIds: [] },
  "o1-2": { id: "o1-2", title: "Close 10 Enterprise Deals", type: "Objective", status: "at-risk", confidence: "Medium", progress: 40, ownerId: "u2", team: "Sales", cycle: "FY 2026", dueDate: "2026-12-31", linkedProjectIds: [], parentId: "g1", childIds: ["kr1-2-1", "kr1-2-2"], description: undefined },
  "kr1-2-1": { id: "kr1-2-1", title: "Generate $2M in Enterprise Pipeline", type: "Key Result", status: "on-track", confidence: "High", progress: 75, ownerId: "u2", team: "Marketing", cycle: "Q3 2026", dueDate: "2026-09-30", targetMetric: "$2.0M", currentMetric: "$1.5M", linkedProjectIds: [], parentId: "o1-2", childIds: [] },
  "kr1-2-2": { id: "kr1-2-2", title: "Sign 10 Fortune 500 Logos", type: "Key Result", status: "at-risk", confidence: "Low", progress: 30, ownerId: "u1", team: "Sales", cycle: "FY 2026", dueDate: "2026-12-31", targetMetric: "10 Logos", currentMetric: "3 Logos", linkedProjectIds: [], parentId: "o1-2", childIds: [] },
  g2: { id: "g2", title: "Improve Platform Reliability", type: "Company Goal", status: "off-track", confidence: "Low", progress: 25, ownerId: "u6", team: "Engineering", cycle: "Q3 2026", dueDate: "2026-09-30", linkedProjectIds: ["PRJ-106"], parentId: undefined, childIds: ["o2-1"], description: "Ensure our platform can handle 10x scale without degradation." },
  "o2-1": { id: "o2-1", title: "Achieve 99.99% Uptime", type: "Objective", status: "off-track", confidence: "Low", progress: 10, ownerId: "u6", team: "Infrastructure", cycle: "Q3 2026", dueDate: "2026-09-30", linkedProjectIds: ["PRJ-106"], parentId: "g2", childIds: ["kr2-1-1"], description: undefined },
  "kr2-1-1": { id: "kr2-1-1", title: "Migrate to Global Distributed DB", type: "Key Result", status: "off-track", confidence: "Low", progress: 15, ownerId: "u5", team: "Infrastructure", cycle: "Q3 2026", dueDate: "2026-09-30", targetMetric: "100% Migrated", currentMetric: "15% Migrated", linkedProjectIds: [], parentId: "o2-1", childIds: [] },
  g3: { id: "g3", title: "Launch Mobile App V2", type: "Company Goal", status: "on-track", confidence: "High", progress: 90, ownerId: "u2", team: "Product", cycle: "Q3 2026", dueDate: "2026-08-30", linkedProjectIds: ["PRJ-102"], parentId: undefined, childIds: ["o3-1"], description: undefined },
  "o3-1": { id: "o3-1", title: "Release iOS & Android Apps", type: "Objective", status: "on-track", confidence: "High", progress: 95, ownerId: "u2", team: "Mobile", cycle: "Q3 2026", dueDate: "2026-08-15", linkedProjectIds: ["PRJ-102"], parentId: "g3", childIds: ["kr3-1-1"], description: undefined },
  "kr3-1-1": { id: "kr3-1-1", title: "App Store Approval", type: "Key Result", status: "completed", confidence: "High", progress: 100, ownerId: "u2", team: "Mobile", cycle: "Q3 2026", dueDate: "2026-08-10", linkedProjectIds: [], parentId: "o3-1", childIds: [] },
};

const INITIATIVES: Record<string, Initiative> = {
  "INIT-201": { id: "INIT-201", name: "Q3 Enterprise Expansion", description: "Strategic push to acquire 50 new enterprise logos in the EMEA region.", status: "Active", health: "On Track", progress: 45, ownerId: "u2", department: "Sales & Marketing", startDate: "2026-07-01", dueDate: "2026-09-30", priority: "Critical", budget: { allocated: 250000, spent: 110000, status: "On Budget" }, milestones: { total: 8, completed: 3 }, risks: 1, tags: ["GTM", "EMEA", "Enterprise"], lastUpdated: isoNow, linkedProjectIds: ["PRJ-103"] },
  "INIT-202": { id: "INIT-202", name: "Infrastructure Modernization", description: "Migrate core legacy microservices to Kubernetes and implement zero-trust network architecture.", status: "Active", health: "At Risk", progress: 62, ownerId: "u5", department: "Engineering", startDate: "2026-01-15", dueDate: "2026-06-30", priority: "High", budget: { allocated: 500000, spent: 420000, status: "Over" }, milestones: { total: 12, completed: 7 }, risks: 4, tags: ["DevOps", "Security"], lastUpdated: isoNow, linkedProjectIds: ["PRJ-106"] },
  "INIT-203": { id: "INIT-203", name: "AI Feature Rollout", description: "Launch the new generative AI capabilities across the core product suite.", status: "Active", health: "On Track", progress: 85, ownerId: "u4", department: "Product", startDate: "2026-02-01", dueDate: "2026-04-15", priority: "Critical", budget: { allocated: 150000, spent: 120000, status: "On Budget" }, milestones: { total: 5, completed: 4 }, risks: 0, tags: ["AI", "Product Launch"], lastUpdated: isoNow, linkedProjectIds: [] },
  "INIT-204": { id: "INIT-204", name: "SOC2 Type II Compliance", description: "Complete all audits, policy updates, and technical controls for SOC2 Type II.", status: "Planning", health: "On Track", progress: 15, ownerId: "u6", department: "Security", startDate: "2026-05-01", dueDate: "2026-11-30", priority: "High", budget: { allocated: 80000, spent: 5000, status: "Under" }, milestones: { total: 6, completed: 1 }, risks: 2, tags: ["Compliance", "Security"], lastUpdated: isoNow, linkedProjectIds: ["PRJ-104"] },
  "INIT-205": { id: "INIT-205", name: "Customer Success Portal", description: "Self-serve portal for enterprise customers to manage licenses, billing, and support.", status: "Paused", health: "Off Track", progress: 30, ownerId: "u3", department: "Customer Success", startDate: "2026-01-10", dueDate: "2026-05-15", priority: "Medium", budget: { allocated: 120000, spent: 85000, status: "Over" }, milestones: { total: 4, completed: 1 }, risks: 5, tags: ["Customer Experience"], lastUpdated: isoNow, linkedProjectIds: ["PRJ-105"] },
};

const SPRINTS: Record<string, Sprint> = {
  "sprint-23": { id: "sprint-23", name: "Sprint 23", startDate: daysFromNow(-14), endDate: daysFromNow(-1), status: "completed", goalDescription: "Complete auth flow and design system audit" },
  "sprint-24": { id: "sprint-24", name: "Sprint 24", startDate: daysFromNow(0), endDate: daysFromNow(13), status: "active", goalDescription: "Ship mobile fixes and security audit" },
  "sprint-25": { id: "sprint-25", name: "Sprint 25", startDate: daysFromNow(14), endDate: daysFromNow(27), status: "planning", goalDescription: "Onboarding wizard and time tracking" },
};

const AUTOMATIONS: Record<string, Automation> = {
  "auto-1": { id: "auto-1", name: "Auto-close when all subtasks done", description: "When all subtasks are completed, set task status to Done", trigger: { type: "task_completed", conditions: { scope: "subtasks" } }, actions: [{ type: "set_status", config: { status: "Done" } }], enabled: true, triggerCount: 23 },
  "auto-2": { id: "auto-2", name: "Notify on urgent task creation", description: "Send notification when a new urgent task is created", trigger: { type: "new_task_created", conditions: { priority: "Urgent" } }, actions: [{ type: "send_notification", config: { channel: "slack", message: "New urgent task created" } }], enabled: true, triggerCount: 8 },
  "auto-3": { id: "auto-3", name: "Move overdue tasks to review", description: "When due date passes, move task to In Review for triage", trigger: { type: "due_date_passed" }, actions: [{ type: "set_status", config: { status: "In Review" } }, { type: "add_tag", config: { tag: "overdue" } }], enabled: false, triggerCount: 0 },
  "auto-4": { id: "auto-4", name: "Auto-assign new bugs to DevOps", description: "New bug tasks auto-assigned to DevOps lead", trigger: { type: "new_task_created", conditions: { type: "bug" } }, actions: [{ type: "assign_to", config: { userId: "u5" } }], enabled: true, projectId: "PRJ-106", triggerCount: 12 },
};

const TIME_ENTRIES: TimeEntry[] = [
  { id: "te-1", taskId: "TSK-842", userId: "u2", date: daysFromNow(-1), hours: 3.5, description: "Token audit and documentation" },
  { id: "te-2", taskId: "TSK-842", userId: "u2", date: daysFromNow(0), hours: 2, description: "Spacing token consolidation" },
  { id: "te-3", taskId: "TSK-843", userId: "u3", date: daysFromNow(-1), hours: 5, description: "DnD library integration" },
  { id: "te-4", taskId: "TSK-852", userId: "u6", date: daysFromNow(0), hours: 4, description: "Endpoint auth review" },
  { id: "te-5", taskId: "TSK-846", userId: "u3", date: daysFromNow(-2), hours: 2.5, description: "CSS fix and testing" },
];

const TEMPLATES: ProjectTemplate[] = [
  { id: "tmpl-1", name: "Software Development Sprint", description: "Standard 2-week sprint structure with planning, execution, and retro.", category: "Engineering", taskTemplates: [{ title: "Sprint Planning", description: "Plan the sprint backlog and assign story points", status: "To Do", priority: "High", subtasks: ["Review backlog", "Estimate stories", "Assign tasks"], tags: ["Planning"] }, { title: "Daily Standup Notes", description: "Document daily standup outcomes", status: "To Do", priority: "Low", subtasks: [], tags: ["Meetings"] }, { title: "Sprint Review / Demo", description: "Demonstrate completed work to stakeholders", status: "To Do", priority: "Medium", subtasks: ["Prepare demo", "Send invites", "Record demo"], tags: ["Review"] }, { title: "Sprint Retrospective", description: "Reflect on what went well and areas to improve", status: "To Do", priority: "Medium", subtasks: ["Collect feedback", "Identify action items"], tags: ["Retro"] }] },
  { id: "tmpl-2", name: "Marketing Campaign", description: "End-to-end marketing campaign from planning to launch and analysis.", category: "Marketing", taskTemplates: [{ title: "Campaign Strategy & Brief", description: "Define campaign goals, target audience, and key messages", status: "To Do", priority: "High", subtasks: ["Define goals", "Identify audience", "Create brief"], tags: ["Strategy"] }, { title: "Content Creation", description: "Create campaign assets: copy, visuals, videos", status: "To Do", priority: "High", subtasks: ["Write copy", "Design visuals", "Produce video"], tags: ["Content"] }, { title: "Channel Setup", description: "Configure distribution channels", status: "To Do", priority: "Medium", subtasks: ["Email setup", "Social media", "Paid ads"], tags: ["Distribution"] }, { title: "Launch & Monitor", description: "Execute the campaign and track performance", status: "To Do", priority: "Urgent", subtasks: ["Launch campaign", "Monitor metrics", "A/B test"], tags: ["Launch"] }] },
  { id: "tmpl-3", name: "Product Launch", description: "Cross-functional product launch checklist.", category: "Product", taskTemplates: [{ title: "Launch Readiness Review", description: "Verify all teams are ready for launch", status: "To Do", priority: "Urgent", subtasks: ["Engineering sign-off", "QA sign-off", "Marketing ready", "Support trained"], tags: ["Launch"] }, { title: "Beta Testing", description: "Run beta program with select customers", status: "To Do", priority: "High", subtasks: ["Select beta users", "Collect feedback", "Fix critical bugs"], tags: ["Beta"] }, { title: "Go-to-Market", description: "Execute GTM plan", status: "To Do", priority: "High", subtasks: ["Press release", "Blog post", "Social media", "Email campaign"], tags: ["GTM"] }] },
  { id: "tmpl-4", name: "Client Onboarding", description: "Onboard new clients with a structured process.", category: "Operations", taskTemplates: [{ title: "Kickoff Meeting", description: "Initial meeting to align on goals and timeline", status: "To Do", priority: "High", subtasks: ["Schedule meeting", "Prepare agenda", "Send follow-up"], tags: ["Meetings"] }, { title: "Account Setup", description: "Configure client workspace and permissions", status: "To Do", priority: "High", subtasks: ["Create workspace", "Set permissions", "Import data"], tags: ["Setup"] }, { title: "Training Sessions", description: "Train client team on the platform", status: "To Do", priority: "Medium", subtasks: ["Schedule sessions", "Prepare materials", "Record sessions"], tags: ["Training"] }] },
];

const REQUEST_FORMS: Record<string, RequestForm> = {
  "form-1": { id: "form-1", name: "Bug Report", description: "Submit a bug report for the engineering team", fields: [{ id: "f1", type: "text", label: "Bug Title", required: true }, { id: "f2", type: "textarea", label: "Steps to Reproduce", required: true }, { id: "f3", type: "select", label: "Severity", required: true, options: ["Critical", "High", "Medium", "Low"] }, { id: "f4", type: "select", label: "Platform", required: false, options: ["Web", "iOS", "Android", "API"] }], projectId: "PRJ-106", autoAssigneeId: "u5", isPublic: false, submissionCount: 24 },
  "form-2": { id: "form-2", name: "Feature Request", description: "Request a new feature or enhancement", fields: [{ id: "f5", type: "text", label: "Feature Title", required: true }, { id: "f6", type: "textarea", label: "Description & Use Case", required: true }, { id: "f7", type: "priority", label: "Priority", required: true }, { id: "f8", type: "select", label: "Category", required: false, options: ["UI/UX", "Performance", "Integration", "Security", "Other"] }], projectId: undefined, isPublic: true, submissionCount: 47 },
  "form-3": { id: "form-3", name: "Design Review Request", description: "Request a design review for your work", fields: [{ id: "f9", type: "text", label: "Review Title", required: true }, { id: "f10", type: "textarea", label: "Context", required: true }, { id: "f11", type: "date", label: "Needed By", required: true }, { id: "f12", type: "assignee", label: "Reviewer", required: false }], projectId: "PRJ-101", isPublic: false, submissionCount: 11 },
};

const REQUEST_SUBMISSIONS: RequestSubmission[] = [
  { id: "sub-1", formId: "form-1", values: { "Bug Title": "Login button unresponsive on Safari", "Steps to Reproduce": "1. Open Safari\n2. Navigate to login\n3. Click login button", "Severity": "High", "Platform": "Web" }, status: "converted", submittedAt: isoNow, submittedBy: "u7", convertedTaskId: "TSK-846" },
  { id: "sub-2", formId: "form-2", values: { "Feature Title": "Dark mode for docs editor", "Description & Use Case": "Many users work late. Dark mode reduces eye strain.", "Priority": "Medium", "Category": "UI/UX" }, status: "pending", submittedAt: isoNow, submittedBy: "u4" },
  { id: "sub-3", formId: "form-2", values: { "Feature Title": "Keyboard shortcut customization", "Description & Use Case": "Let users rebind keyboard shortcuts.", "Priority": "Low", "Category": "UI/UX" }, status: "approved", submittedAt: isoNow, submittedBy: "u3" },
  { id: "sub-4", formId: "form-1", values: { "Bug Title": "Calendar drag-drop doesn't save", "Steps to Reproduce": "1. Open calendar\n2. Drag event\n3. Reload page\n4. Event reverted", "Severity": "Medium", "Platform": "Web" }, status: "pending", submittedAt: isoNow, submittedBy: "u5" },
];

const CALENDAR_ITEMS: Record<string, CalendarItem> = {
  "CAL-001": { id: "CAL-001", title: "Website Redesign Sprint Review", type: "event", status: "planned", priority: "High", startDate: `${daysFromNow(1)}T10:00:00`, endDate: `${daysFromNow(1)}T11:30:00`, assigneeId: "u1", projectId: "PRJ-101", progress: 0, description: "Review sprint progress with stakeholders", tags: ["Review", "Sprint"] },
  "CAL-002": { id: "CAL-002", title: "Mobile App Beta Release", type: "milestone", status: "planned", priority: "Urgent", startDate: `${daysFromNow(5)}T09:00:00`, endDate: `${daysFromNow(5)}T09:00:00`, assigneeId: "u2", projectId: "PRJ-102", progress: 0, description: "Release beta build to TestFlight and Play Store", tags: ["Release", "Mobile"] },
  "CAL-003": { id: "CAL-003", title: "Design Token Consolidation", type: "task", status: "in-progress", priority: "High", startDate: `${daysFromNow(-2)}T09:00:00`, endDate: `${daysFromNow(2)}T17:00:00`, assigneeId: "u4", projectId: "PRJ-101", progress: 60, tags: ["Design", "System"] },
  "CAL-004": { id: "CAL-004", title: "Security Audit Kickoff", type: "event", status: "completed", priority: "High", startDate: `${daysFromNow(-3)}T14:00:00`, endDate: `${daysFromNow(-3)}T15:00:00`, assigneeId: "u6", projectId: "PRJ-104", progress: 100, tags: ["Security"] },
  "CAL-005": { id: "CAL-005", title: "Q2 Campaign Planning Workshop", type: "event", status: "planned", priority: "Medium", startDate: `${daysFromNow(3)}T13:00:00`, endDate: `${daysFromNow(3)}T16:00:00`, assigneeId: "u7", projectId: "PRJ-103", progress: 0, description: "Workshop to define Q2 campaign strategy and channels", tags: ["Marketing", "Strategy"] },
  "CAL-006": { id: "CAL-006", title: "Infrastructure Migration Phase 2", type: "milestone", status: "at-risk", priority: "Urgent", startDate: `${daysFromNow(7)}T00:00:00`, endDate: `${daysFromNow(7)}T00:00:00`, assigneeId: "u5", projectId: "PRJ-106", progress: 0, description: "Complete Kubernetes migration for core services", tags: ["DevOps"] },
  "CAL-007": { id: "CAL-007", title: "Team All-Hands Meeting", type: "event", status: "planned", priority: "Low", startDate: `${daysFromNow(4)}T11:00:00`, endDate: `${daysFromNow(4)}T12:00:00`, progress: 0, description: "Monthly all-hands to share company updates", tags: ["Meeting"] },
  "CAL-008": { id: "CAL-008", title: "API v2 Documentation Review", type: "task", status: "planned", priority: "Medium", startDate: `${daysFromNow(2)}T10:00:00`, endDate: `${daysFromNow(4)}T17:00:00`, assigneeId: "u3", projectId: "PRJ-106", progress: 0, tags: ["Documentation", "API"] },
  "CAL-009": { id: "CAL-009", title: "Customer Portal UX Testing", type: "task", status: "in-progress", priority: "High", startDate: `${daysFromNow(-1)}T09:00:00`, endDate: `${daysFromNow(3)}T17:00:00`, assigneeId: "u4", projectId: "PRJ-105", progress: 35, description: "Run usability tests with 5 enterprise customers", tags: ["UX", "Testing"] },
  "CAL-010": { id: "CAL-010", title: "SOC2 Compliance Deadline", type: "milestone", status: "planned", priority: "Urgent", startDate: `${daysFromNow(14)}T00:00:00`, endDate: `${daysFromNow(14)}T00:00:00`, assigneeId: "u6", projectId: "PRJ-104", progress: 0, description: "Final deadline for SOC2 Type II audit completion", tags: ["Compliance", "Deadline"] },
};

// ============================================================
// CONTEXT INTERFACE
// ============================================================

interface AppDataContextType {
  // Entities
  users: Record<string, User>;
  tasks: Record<string, Task>;
  projects: Record<string, Project>;
  goals: Record<string, GoalItem>;
  initiatives: Record<string, Initiative>;
  sprints: Record<string, Sprint>;
  automations: Record<string, Automation>;
  timeEntries: TimeEntry[];
  templates: ProjectTemplate[];
  requestForms: Record<string, RequestForm>;
  requestSubmissions: RequestSubmission[];
  docs: DocItem[];
  calendarItems: Record<string, CalendarItem>;

  // Current user
  currentUser: User;

  // User helpers
  getUser: (id: string) => User | undefined;
  getUserList: () => User[];

  // Task CRUD
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => Task | undefined;

  // Task queries
  getTasksForProject: (projectId: string) => Task[];
  getTasksForSprint: (sprintId: string) => Task[];
  getTasksForAssignee: (userId: string) => Task[];
  getOverdueTasks: () => Task[];
  getMyTasks: () => Task[];
  getAllTasks: () => Task[];

  // Project CRUD
  addProject: (project: Omit<Project, "id" | "lastUpdated">) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getAllProjects: () => Project[];

  // Goal CRUD
  addGoal: (goal: Omit<GoalItem, "id">) => GoalItem;
  updateGoal: (id: string, updates: Partial<GoalItem>) => void;
  deleteGoal: (id: string) => void;
  getRootGoals: () => GoalItem[];
  getGoalChildren: (parentId: string) => GoalItem[];

  // Initiative CRUD
  addInitiative: (init: Omit<Initiative, "id" | "lastUpdated">) => Initiative;
  updateInitiative: (id: string, updates: Partial<Initiative>) => void;
  deleteInitiative: (id: string) => void;
  getAllInitiatives: () => Initiative[];

  // Sprint CRUD
  addSprint: (sprint: Omit<Sprint, "id">) => Sprint;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  getActiveSprint: () => Sprint | undefined;
  getAllSprints: () => Sprint[];

  // Automation CRUD
  addAutomation: (auto: Omit<Automation, "id" | "triggerCount">) => Automation;
  updateAutomation: (id: string, updates: Partial<Automation>) => void;
  deleteAutomation: (id: string) => void;
  getAllAutomations: () => Automation[];

  // Time tracking
  addTimeEntry: (entry: Omit<TimeEntry, "id">) => void;
  getTimeEntriesForTask: (taskId: string) => TimeEntry[];
  getTotalHoursForTask: (taskId: string) => number;

  // Request intake
  addRequestSubmission: (sub: Omit<RequestSubmission, "id" | "submittedAt">) => void;
  updateRequestSubmission: (id: string, updates: Partial<RequestSubmission>) => void;
  convertRequestToTask: (submissionId: string) => Task | undefined;
  getAllRequestForms: () => RequestForm[];
  getSubmissionsForForm: (formId: string) => RequestSubmission[];
  getAllSubmissions: () => RequestSubmission[];

  // Templates
  getAllTemplates: () => ProjectTemplate[];
  createProjectFromTemplate: (templateId: string, projectName: string) => Project | undefined;

  // Calendar CRUD
  addCalendarItem: (item: Omit<CalendarItem, "id">) => CalendarItem;
  updateCalendarItem: (id: string, updates: Partial<CalendarItem>) => void;
  deleteCalendarItem: (id: string) => void;
  getAllCalendarItems: () => CalendarItem[];

  // Computed metrics
  getProjectTaskStats: (projectId: string) => { total: number; completed: number; overdue: number; progress: number };
  getSprintTaskStats: (sprintId: string) => { total: number; completed: number; inProgress: number; todo: number };
  getTeamWorkload: () => { userId: string; taskCount: number; totalHours: number }[];
}

// ============================================================
// PROVIDER
// ============================================================

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

let taskCounter = 855;
let projectCounter = 107;
let goalCounter = 100;
let initiativeCounter = 206;
let sprintCounter = 26;
let automationCounter = 5;
let timeEntryCounter = 6;
let submissionCounter = 5;
let calendarItemCounter = 11;

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [users] = useState<Record<string, User>>(USERS);
  const [tasks, setTasks] = useState<Record<string, Task>>(TASKS);
  const [projects, setProjects] = useState<Record<string, Project>>(PROJECTS);
  const [goals, setGoals] = useState<Record<string, GoalItem>>(GOALS);
  const [initiatives, setInitiatives] = useState<Record<string, Initiative>>(INITIATIVES);
  const [sprints, setSprints] = useState<Record<string, Sprint>>(SPRINTS);
  const [automations, setAutomations] = useState<Record<string, Automation>>(AUTOMATIONS);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(TIME_ENTRIES);
  const [templates] = useState<ProjectTemplate[]>(TEMPLATES);
  const [requestForms] = useState<Record<string, RequestForm>>(REQUEST_FORMS);
  const [requestSubmissions, setRequestSubmissions] = useState<RequestSubmission[]>(REQUEST_SUBMISSIONS);
  const [docs] = useState<DocItem[]>([]);
  const [calendarItems, setCalendarItems] = useState<Record<string, CalendarItem>>(CALENDAR_ITEMS);

  const currentUser = users["u1"];

  // ---- User helpers ----
  const getUser = useCallback((id: string) => users[id], [users]);
  const getUserList = useCallback(() => Object.values(users), [users]);

  // ---- Task CRUD ----
  const addTask = useCallback((taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    const id = `TSK-${taskCounter++}`;
    const newTask: Task = { ...taskData, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setTasks((prev) => ({ ...prev, [id]: newTask }));
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates, updatedAt: new Date().toISOString() } };
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const duplicateTask = useCallback((id: string) => {
    const original = tasks[id];
    if (!original) return undefined;
    const newId = `TSK-${taskCounter++}`;
    const dup: Task = { ...original, id: newId, title: `${original.title} (Copy)`, status: "To Do", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), comments: [], subtasks: original.subtasks.map((s, i) => ({ ...s, id: `st-dup-${newId}-${i}`, completed: false })) };
    setTasks((prev) => ({ ...prev, [newId]: dup }));
    return dup;
  }, [tasks]);

  // ---- Task queries ----
  const getAllTasks = useCallback(() => Object.values(tasks), [tasks]);
  const getTasksForProject = useCallback((projectId: string) => Object.values(tasks).filter((t) => t.projectId === projectId), [tasks]);
  const getTasksForSprint = useCallback((sprintId: string) => Object.values(tasks).filter((t) => t.sprintId === sprintId), [tasks]);
  const getTasksForAssignee = useCallback((userId: string) => Object.values(tasks).filter((t) => t.assigneeId === userId), [tasks]);
  const getOverdueTasks = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return Object.values(tasks).filter((t) => t.dueDate && t.dueDate < today && t.status !== "Done");
  }, [tasks]);
  const getMyTasks = useCallback(() => Object.values(tasks).filter((t) => t.assigneeId === currentUser.id && t.status !== "Done"), [tasks, currentUser.id]);

  // ---- Project CRUD ----
  const addProject = useCallback((data: Omit<Project, "id" | "lastUpdated">) => {
    const id = `PRJ-${projectCounter++}`;
    const newP: Project = { ...data, id, lastUpdated: new Date().toISOString() };
    setProjects((prev) => ({ ...prev, [id]: newP }));
    return newP;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates, lastUpdated: new Date().toISOString() } };
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const getAllProjects = useCallback(() => Object.values(projects), [projects]);

  // ---- Goal CRUD ----
  const addGoal = useCallback((data: Omit<GoalItem, "id">) => {
    const id = `goal-${goalCounter++}`;
    const newG: GoalItem = { ...data, id };
    setGoals((prev) => {
      const next = { ...prev, [id]: newG };
      if (newG.parentId && next[newG.parentId]) {
        next[newG.parentId] = { ...next[newG.parentId], childIds: [...next[newG.parentId].childIds, id] };
      }
      return next;
    });
    return newG;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<GoalItem>) => {
    setGoals((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates } };
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const getRootGoals = useCallback(() => Object.values(goals).filter((g) => !g.parentId), [goals]);
  const getGoalChildren = useCallback((parentId: string) => Object.values(goals).filter((g) => g.parentId === parentId), [goals]);

  // ---- Initiative CRUD ----
  const addInitiative = useCallback((data: Omit<Initiative, "id" | "lastUpdated">) => {
    const id = `INIT-${initiativeCounter++}`;
    const newI: Initiative = { ...data, id, lastUpdated: new Date().toISOString() };
    setInitiatives((prev) => ({ ...prev, [id]: newI }));
    return newI;
  }, []);

  const updateInitiative = useCallback((id: string, updates: Partial<Initiative>) => {
    setInitiatives((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates, lastUpdated: new Date().toISOString() } };
    });
  }, []);

  const deleteInitiative = useCallback((id: string) => {
    setInitiatives((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const getAllInitiatives = useCallback(() => Object.values(initiatives), [initiatives]);

  // ---- Sprint CRUD ----
  const addSprint = useCallback((data: Omit<Sprint, "id">) => {
    const id = `sprint-${sprintCounter++}`;
    const newS: Sprint = { ...data, id };
    setSprints((prev) => ({ ...prev, [id]: newS }));
    return newS;
  }, []);

  const updateSprint = useCallback((id: string, updates: Partial<Sprint>) => {
    setSprints((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates } };
    });
  }, []);

  const getActiveSprint = useCallback(() => Object.values(sprints).find((s) => s.status === "active"), [sprints]);
  const getAllSprints = useCallback(() => Object.values(sprints), [sprints]);

  // ---- Automation CRUD ----
  const addAutomation = useCallback((data: Omit<Automation, "id" | "triggerCount">) => {
    const id = `auto-${automationCounter++}`;
    const newA: Automation = { ...data, id, triggerCount: 0 };
    setAutomations((prev) => ({ ...prev, [id]: newA }));
    return newA;
  }, []);

  const updateAutomation = useCallback((id: string, updates: Partial<Automation>) => {
    setAutomations((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates } };
    });
  }, []);

  const deleteAutomation = useCallback((id: string) => {
    setAutomations((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const getAllAutomations = useCallback(() => Object.values(automations), [automations]);

  // ---- Time tracking ----
  const addTimeEntry = useCallback((data: Omit<TimeEntry, "id">) => {
    const id = `te-${timeEntryCounter++}`;
    setTimeEntries((prev) => [...prev, { ...data, id }]);
  }, []);

  const getTimeEntriesForTask = useCallback((taskId: string) => timeEntries.filter((e) => e.taskId === taskId), [timeEntries]);
  const getTotalHoursForTask = useCallback((taskId: string) => timeEntries.filter((e) => e.taskId === taskId).reduce((sum, e) => sum + e.hours, 0), [timeEntries]);

  // ---- Request intake ----
  const addRequestSubmission = useCallback((data: Omit<RequestSubmission, "id" | "submittedAt">) => {
    const id = `sub-${submissionCounter++}`;
    setRequestSubmissions((prev) => [...prev, { ...data, id, submittedAt: new Date().toISOString() }]);
  }, []);

  const updateRequestSubmission = useCallback((id: string, updates: Partial<RequestSubmission>) => {
    setRequestSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const convertRequestToTask = useCallback((submissionId: string) => {
    const sub = requestSubmissions.find((s) => s.id === submissionId);
    if (!sub) return undefined;
    const form = requestForms[sub.formId];
    const title = sub.values[form?.fields[0]?.label ?? "title"] ?? "Untitled Request";
    const desc = sub.values[form?.fields[1]?.label ?? ""] ?? "";
    const newTask = addTask({ title, description: desc, status: "To Do", priority: "Medium", type: "task", assigneeId: form?.autoAssigneeId, watcherIds: [], projectId: form?.projectId, tags: ["from-request"], subtasks: [], checklist: [], comments: [], attachmentCount: 0, dependencies: [] });
    updateRequestSubmission(submissionId, { status: "converted", convertedTaskId: newTask.id });
    return newTask;
  }, [requestSubmissions, requestForms, addTask, updateRequestSubmission]);

  const getAllRequestForms = useCallback(() => Object.values(requestForms), [requestForms]);
  const getSubmissionsForForm = useCallback((formId: string) => requestSubmissions.filter((s) => s.formId === formId), [requestSubmissions]);
  const getAllSubmissions = useCallback(() => requestSubmissions, [requestSubmissions]);

  // ---- Templates ----
  const getAllTemplates = useCallback(() => templates, [templates]);

  // ---- Calendar CRUD ----
  const addCalendarItem = useCallback((data: Omit<CalendarItem, "id">) => {
    const id = `CAL-${String(calendarItemCounter++).padStart(3, "0")}`;
    const newItem: CalendarItem = { ...data, id };
    setCalendarItems((prev) => ({ ...prev, [id]: newItem }));
    return newItem;
  }, []);

  const updateCalendarItem = useCallback((id: string, updates: Partial<CalendarItem>) => {
    setCalendarItems((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates } };
    });
  }, []);

  const deleteCalendarItem = useCallback((id: string) => {
    setCalendarItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const getAllCalendarItems = useCallback(() => Object.values(calendarItems), [calendarItems]);

  const createProjectFromTemplate = useCallback((templateId: string, projectName: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return undefined;
    const newProject = addProject({ name: projectName, description: tmpl.description, status: "Planning", health: "On Track", progress: 0, ownerId: currentUser.id, teamIds: [], dueDate: daysFromNow(30), tags: [tmpl.category], isFavorite: false });
    tmpl.taskTemplates.forEach((tt) => {
      addTask({ title: tt.title, description: tt.description, status: tt.status, priority: tt.priority, type: "task", assigneeId: undefined, watcherIds: [], projectId: newProject.id, tags: tt.tags, subtasks: tt.subtasks.map((s, i) => ({ id: `st-tmpl-${i}`, title: s, completed: false })), checklist: [], comments: [], attachmentCount: 0, dependencies: [] });
    });
    return newProject;
  }, [templates, addProject, addTask, currentUser.id]);

  // ---- Computed metrics ----
  const getProjectTaskStats = useCallback((projectId: string) => {
    const projectTasks = Object.values(tasks).filter((t) => t.projectId === projectId);
    const completed = projectTasks.filter((t) => t.status === "Done").length;
    const today = new Date().toISOString().split("T")[0];
    const overdue = projectTasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "Done").length;
    return { total: projectTasks.length, completed, overdue, progress: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0 };
  }, [tasks]);

  const getSprintTaskStats = useCallback((sprintId: string) => {
    const sprintTasks = Object.values(tasks).filter((t) => t.sprintId === sprintId);
    return {
      total: sprintTasks.length,
      completed: sprintTasks.filter((t) => t.status === "Done").length,
      inProgress: sprintTasks.filter((t) => t.status === "In Progress" || t.status === "In Review").length,
      todo: sprintTasks.filter((t) => t.status === "To Do").length,
    };
  }, [tasks]);

  const getTeamWorkload = useCallback(() => {
    return Object.values(users).map((user) => {
      const userTasks = Object.values(tasks).filter((t) => t.assigneeId === user.id && t.status !== "Done");
      const totalHours = timeEntries.filter((e) => e.userId === user.id).reduce((sum, e) => sum + e.hours, 0);
      return { userId: user.id, taskCount: userTasks.length, totalHours };
    });
  }, [users, tasks, timeEntries]);

  const value = useMemo<AppDataContextType>(() => ({
    users, tasks, projects, goals, initiatives, sprints, automations, timeEntries, templates, requestForms, requestSubmissions, docs, calendarItems, currentUser,
    getUser, getUserList,
    addTask, updateTask, deleteTask, duplicateTask, getAllTasks, getTasksForProject, getTasksForSprint, getTasksForAssignee, getOverdueTasks, getMyTasks,
    addProject, updateProject, deleteProject, getAllProjects,
    addGoal, updateGoal, deleteGoal, getRootGoals, getGoalChildren,
    addInitiative, updateInitiative, deleteInitiative, getAllInitiatives,
    addSprint, updateSprint, getActiveSprint, getAllSprints,
    addAutomation, updateAutomation, deleteAutomation, getAllAutomations,
    addTimeEntry, getTimeEntriesForTask, getTotalHoursForTask,
    addRequestSubmission, updateRequestSubmission, convertRequestToTask, getAllRequestForms, getSubmissionsForForm, getAllSubmissions,
    getAllTemplates, createProjectFromTemplate,
    addCalendarItem, updateCalendarItem, deleteCalendarItem, getAllCalendarItems,
    getProjectTaskStats, getSprintTaskStats, getTeamWorkload,
  }), [users, tasks, projects, goals, initiatives, sprints, automations, timeEntries, templates, requestForms, requestSubmissions, docs, calendarItems, currentUser, getUser, getUserList, addTask, updateTask, deleteTask, duplicateTask, getAllTasks, getTasksForProject, getTasksForSprint, getTasksForAssignee, getOverdueTasks, getMyTasks, addProject, updateProject, deleteProject, getAllProjects, addGoal, updateGoal, deleteGoal, getRootGoals, getGoalChildren, addInitiative, updateInitiative, deleteInitiative, getAllInitiatives, addSprint, updateSprint, getActiveSprint, getAllSprints, addAutomation, updateAutomation, deleteAutomation, getAllAutomations, addTimeEntry, getTimeEntriesForTask, getTotalHoursForTask, addRequestSubmission, updateRequestSubmission, convertRequestToTask, getAllRequestForms, getSubmissionsForForm, getAllSubmissions, getAllTemplates, createProjectFromTemplate, addCalendarItem, updateCalendarItem, deleteCalendarItem, getAllCalendarItems, getProjectTaskStats, getSprintTaskStats, getTeamWorkload]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
