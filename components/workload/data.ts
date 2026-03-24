import type { ProjectResponse, TaskPriority, TaskResponse, WorkloadMember } from "@/lib/api/contracts";

export type WorkloadTone = "idle" | "balanced" | "watch" | "busy";

export interface WorkloadMemberView extends WorkloadMember {
  id: string;
  activeTaskCount: number;
  completionRate: number;
  workloadTone: WorkloadTone;
  topProjects: string[];
  topTasks: string[];
}

export interface WorkloadTaskView {
  id: string;
  title: string;
  projectId?: string | null;
  projectName: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  priority: TaskPriority;
  status: TaskResponse["status"];
  estimateHours?: number | null;
  estimatePoints?: number | null;
  dueDate?: string | null;
  completedAt?: string | null;
  labels: string[];
  updatedAt: string;
  isOverdue: boolean;
}

export interface WorkloadSummaryStats {
  totalMembers: number;
  activeMembers: number;
  assignedTasks: number;
  completedTasks: number;
  totalPoints: number;
  totalHoursLogged: number;
  averageCompletionRate: number;
}

export interface WorkloadProjectOption {
  id: string;
  label: string;
  identifier: string;
}

export const WORKLOAD_FEATURES = [
  "Live member totals from analytics",
  "Task-level drill-down from workspace tasks",
  "Project-scoped filtering backed by the API",
  "No demo allocations or fabricated capacity rows",
] as const;

function normalizeEnumValue(value: string | number | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getWorkloadTone(member: Pick<WorkloadMemberView, "activeTaskCount" | "assignedTasks" | "completedTasks" | "totalHoursLogged">): WorkloadTone {
  if (member.assignedTasks === 0) {
    return "idle";
  }

  if (member.completedTasks >= member.assignedTasks) {
    return "balanced";
  }

  if (member.totalHoursLogged >= 40 || member.activeTaskCount >= 5) {
    return "busy";
  }

  return "watch";
}

export function getWorkloadToneLabel(tone: WorkloadTone) {
  switch (tone) {
    case "idle":
      return "Idle";
    case "balanced":
      return "Balanced";
    case "watch":
      return "Watch";
    case "busy":
      return "Busy";
  }
}

export function getWorkloadToneClasses(tone: WorkloadTone) {
  switch (tone) {
    case "idle":
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    case "balanced":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "watch":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "busy":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  }
}

export function getTaskStatusLabel(status: TaskResponse["status"]) {
  switch (normalizeEnumValue(status)) {
    case "todo":
    case "0":
      return "To do";
    case "backlog":
      return "Backlog";
    case "inprogress":
    case "2":
      return "In progress";
    case "inreview":
    case "3":
      return "In review";
    case "done":
    case "4":
      return "Done";
    case "cancelled":
    case "5":
      return "Cancelled";
    default:
      return "Unknown";
  }
}

export function getTaskStatusTone(status: TaskResponse["status"]) {
  switch (normalizeEnumValue(status)) {
    case "done":
    case "4":
      return "emerald";
    case "inprogress":
    case "2":
    case "inreview":
    case "3":
      return "blue";
    case "cancelled":
    case "5":
      return "slate";
    default:
      return "amber";
  }
}

export function getPriorityLabel(priority: TaskPriority) {
  switch (normalizeEnumValue(priority)) {
    case "0":
    case "none":
      return "None";
    case "1":
    case "low":
      return "Low";
    case "2":
    case "medium":
      return "Medium";
    case "3":
    case "high":
      return "High";
    case "4":
    case "urgent":
      return "Urgent";
    default:
      return "Medium";
  }
}

export function getPriorityTone(priority: TaskPriority) {
  switch (normalizeEnumValue(priority)) {
    case "4":
    case "urgent":
      return "rose";
    case "3":
    case "high":
      return "amber";
    case "2":
    case "medium":
      return "blue";
    default:
      return "slate";
  }
}

export function getTaskAgeLabel(task: Pick<WorkloadTaskView, "dueDate" | "completedAt" | "updatedAt">) {
  const date = task.completedAt ?? task.dueDate ?? task.updatedAt;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function isTaskOverdue(task: Pick<WorkloadTaskView, "dueDate" | "completedAt" | "status">) {
  if (!task.dueDate || task.completedAt) {
    return false;
  }

  const status = normalizeEnumValue(task.status);
  if (status === "done" || status === "4" || status === "cancelled" || status === "5") {
    return false;
  }

  return task.dueDate < new Date().toISOString().slice(0, 10);
}

export function getProjectLabel(project?: ProjectResponse | null) {
  if (!project) {
    return "Unassigned project";
  }

  return `${project.identifier} - ${project.name}`;
}
