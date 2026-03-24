import type {
  ProjectResponse,
  ProjectStatus,
  SprintResponse,
  SprintStatus,
  TaskPriority,
  TaskResponse,
  TaskStatus,
} from "@/lib/api/contracts";

export type TimelineZoomLevel = "days" | "weeks" | "months";
export type TimelineSourceType = "task" | "project" | "sprint";
export type TimelineStatus = "planned" | "in-progress" | "completed" | "at-risk" | "cancelled";
export type TimelinePriority = "None" | "Low" | "Medium" | "High" | "Urgent";

export interface TimelineAssigneeOption {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
}

export interface TimelineItem {
  id: string;
  sourceType: TimelineSourceType;
  sourceId: string;
  title: string;
  description?: string;
  projectId: string;
  projectName: string;
  projectIdentifier: string;
  status: TimelineStatus;
  priority: TimelinePriority;
  assignee?: TimelineAssigneeOption;
  startDate: string;
  endDate: string;
  progress: number;
  taskCount?: number;
  completedTaskCount?: number;
  plannedPoints?: number | null;
  completedPoints?: number | null;
  sprintId?: string;
  sprintName?: string;
  sprintGoal?: string;
  notes?: string;
  rawStatusLabel: string;
}

export interface TimelineFilterOption {
  value: TimelineStatus | "All";
  label: string;
}

export const TIMELINE_STATUS_OPTIONS: TimelineFilterOption[] = [
  { value: "All", label: "All Statuses" },
  { value: "planned", label: "Planned" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "at-risk", label: "At Risk" },
  { value: "cancelled", label: "Cancelled" },
];

export const TIMELINE_SOURCE_LABELS: Record<TimelineSourceType, string> = {
  task: "Task",
  project: "Project",
  sprint: "Sprint",
};

function toInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function buildTimelineAssignee(name: string, avatarUrl?: string | null): TimelineAssigneeOption {
  return {
    id: name,
    name,
    initials: toInitials(name),
    avatarUrl: avatarUrl ?? null,
  };
}

export function parseTimelineDate(value: string) {
  const [datePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map((segment) => Number(segment));

  if (!year || !month || !day) {
    return new Date(value);
  }

  return new Date(year, month - 1, day);
}

export function toTimelineDateKey(value: string) {
  const date = parseTimelineDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTimelineDateRange(startDate: string, endDate: string) {
  const start = parseTimelineDate(startDate);
  const end = parseTimelineDate(endDate);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function isBeforeToday(dateString: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parseTimelineDate(dateString).getTime() < today.getTime();
}

export function timelineSourceLabel(sourceType: TimelineSourceType) {
  return TIMELINE_SOURCE_LABELS[sourceType];
}

export function timelineStatusLabel(status: TimelineStatus) {
  switch (status) {
    case "planned":
      return "Planned";
    case "in-progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "at-risk":
      return "At Risk";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function normalizeTimelinePriority(priority: TaskPriority | null | undefined): TimelinePriority {
  if (priority === "Urgent" || priority === 4) return "Urgent";
  if (priority === "High" || priority === 3) return "High";
  if (priority === "Medium" || priority === 2) return "Medium";
  if (priority === "Low" || priority === 1) return "Low";
  return "None";
}

export function normalizeTimelineStatusFromTask(status: TaskStatus, isOverdue = false): TimelineStatus {
  if (status === "Done" || status === 4) return "completed";
  if (status === "Cancelled" || status === 5) return "cancelled";
  if (isOverdue) return "at-risk";
  if (status === "InReview" || status === 3) return "in-progress";
  if (status === "InProgress" || status === 2) return "in-progress";
  return "planned";
}

export function normalizeTimelineStatusFromProject(
  status: ProjectStatus,
  isOverdue = false,
): TimelineStatus {
  if (status === "Completed" || status === 2) return "completed";
  if (status === "Archived" || status === 3) return "cancelled";
  if (status === "Paused" || status === 1) return isOverdue ? "at-risk" : "planned";
  if (isOverdue) return "at-risk";
  return "in-progress";
}

export function normalizeTimelineStatusFromSprint(
  status: SprintStatus,
  isOverdue = false,
): TimelineStatus {
  if (status === "Completed" || status === 2) return "completed";
  if (status === "Cancelled" || status === 3) return "cancelled";
  if (status === "Active" || status === 1) return isOverdue ? "at-risk" : "in-progress";
  return isOverdue ? "at-risk" : "planned";
}

export function calculateTaskProgress(task: TaskResponse, status: TimelineStatus) {
  if (task.completedAt || status === "completed") {
    return 100;
  }

  if (task.checklistTotal > 0) {
    return Math.round((task.checklistCompleted / task.checklistTotal) * 100);
  }

  switch (status) {
    case "in-progress":
      return 60;
    case "at-risk":
      return 45;
    case "planned":
      return 15;
    case "cancelled":
      return 0;
    default:
      return 0;
  }
}

export function calculateProjectProgress(project: ProjectResponse) {
  if (project.taskCount > 0) {
    return Math.round((project.completedTaskCount / project.taskCount) * 100);
  }

  if (project.status === "Completed" || project.status === 2) {
    return 100;
  }

  return 0;
}

export function calculateSprintProgress(sprint: SprintResponse) {
  if (
    sprint.plannedPoints &&
    sprint.plannedPoints > 0 &&
    sprint.completedPoints !== null &&
    sprint.completedPoints !== undefined
  ) {
    return Math.round((sprint.completedPoints / sprint.plannedPoints) * 100);
  }

  if (sprint.taskCount > 0) {
    return Math.round((sprint.completedTaskCount / sprint.taskCount) * 100);
  }

  if (sprint.status === "Completed" || sprint.status === 2) {
    return 100;
  }

  return 0;
}

export function sortTimelineItems(items: TimelineItem[]) {
  const sourceRank: Record<TimelineSourceType, number> = {
    project: 0,
    sprint: 1,
    task: 2,
  };

  return [...items].sort((a, b) => {
    const startComparison = a.startDate.localeCompare(b.startDate);

    if (startComparison !== 0) {
      return startComparison;
    }

    if (sourceRank[a.sourceType] !== sourceRank[b.sourceType]) {
      return sourceRank[a.sourceType] - sourceRank[b.sourceType];
    }

    return a.title.localeCompare(b.title);
  });
}

export function mergeTimelineAssignees(items: TimelineItem[]) {
  const assignees = new Map<string, TimelineAssigneeOption>();

  for (const item of items) {
    if (item.assignee) {
      assignees.set(item.assignee.id, item.assignee);
    }
  }

  return [...assignees.values()].sort((a, b) => a.name.localeCompare(b.name));
}
