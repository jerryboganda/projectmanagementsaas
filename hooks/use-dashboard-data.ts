"use client";

import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import type {
  NotificationResponse,
  ProjectResponse,
  TaskResponse,
} from "@/lib/api/contracts";
import type {
  DashboardActivityItem,
  DashboardKpi,
  DashboardProjectHealthItem,
  DashboardTaskItem,
} from "@/lib/dashboard/types";

function normalizeTaskStatus(status: TaskResponse["status"]): DashboardTaskItem["status"] {
  if (status === "InProgress" || status === 2) {
    return "in-progress";
  }

  if (status === "InReview" || status === 3) {
    return "in-review";
  }

  return "todo";
}

function formatDueLabel(dueDate?: string | null) {
  if (!dueDate) {
    return { label: "No due date", tone: "muted" as const };
  }

  const parsed = parseISO(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return { label: "No due date", tone: "muted" as const };
  }

  if (isToday(parsed)) {
    return { label: "Today", tone: "danger" as const };
  }

  if (isTomorrow(parsed)) {
    return { label: "Tomorrow", tone: "warning" as const };
  }

  if (isPast(parsed)) {
    return { label: `Overdue ${format(parsed, "MMM dd")}`, tone: "danger" as const };
  }

  return { label: format(parsed, "MMM dd"), tone: "muted" as const };
}

function getProjectHealth(project: ProjectResponse): DashboardProjectHealthItem["health"] {
  const completionRatio =
    project.taskCount > 0 ? project.completedTaskCount / project.taskCount : 0;

  if (project.status === "Completed" || project.status === 2 || completionRatio >= 0.75) {
    return "On Track";
  }

  if (project.status === "Paused" || project.status === 1 || completionRatio < 0.35) {
    return "Off Track";
  }

  return "At Risk";
}

function getActivityTone(type: string): DashboardActivityItem["tone"] {
  const normalized = type.toLowerCase();

  if (normalized.includes("comment") || normalized.includes("mention")) {
    return "primary";
  }

  if (normalized.includes("complete") || normalized.includes("done")) {
    return "success";
  }

  if (normalized.includes("alert") || normalized.includes("priority") || normalized.includes("risk")) {
    return "warning";
  }

  return "neutral";
}

interface DashboardData {
  kpis: DashboardKpi[];
  myWork: DashboardTaskItem[];
  triage: DashboardTaskItem[];
  projectHealth: DashboardProjectHealthItem[];
  activity: DashboardActivityItem[];
}

export function useDashboardData() {
  const { apiClient, session } = useAuth();
  const activeWorkspaceId = session?.activeWorkspaceId ?? null;
  const userId = session?.user.id ?? null;

  return useQuery<DashboardData>({
    queryKey: ["dashboard", activeWorkspaceId, userId],
    enabled: !!activeWorkspaceId && !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const [tasks, projects, notifications, workload] = await Promise.all([
        apiClient.listTasks({
          assigneeId: userId!,
          pageSize: 12,
          sortBy: "dueDate",
          sortOrder: "asc",
        }),
        apiClient.listProjects({
          pageSize: 8,
          sortBy: "updatedAt",
          sortOrder: "desc",
        }),
        apiClient.listNotifications({
          pageSize: 6,
        }),
        apiClient.getWorkload(),
      ]);

      const projectNameById = new Map(projects.map((project) => [project.id, project.name]));
      const activeTasks = tasks.filter(
        (task) => task.status !== "Done" && task.status !== 4 && task.status !== "Cancelled" && task.status !== 5,
      );

      const mapTask = (task: TaskResponse): DashboardTaskItem => {
        const due = formatDueLabel(task.dueDate);

        return {
          id: task.identifier,
          title: task.title,
          status: normalizeTaskStatus(task.status),
          priority:
            typeof task.priority === "number"
              ? ["None", "Low", "Medium", "High", "Urgent"][task.priority] ?? "None"
              : task.priority,
          project: projectNameById.get(task.projectId) ?? "Workspace",
          dueLabel: due.label,
          dueTone: due.tone,
        };
      };

      const openIssues = projects.reduce(
        (total, project) => total + Math.max(project.taskCount - project.completedTaskCount, 0),
        0,
      );
      const completedTasks = projects.reduce(
        (total, project) => total + project.completedTaskCount,
        0,
      );
      const activeMembers = workload.members.filter((member) => member.assignedTasks > 0).length;
      const teamCapacity = workload.members.length
        ? Math.round((activeMembers / workload.members.length) * 100)
        : 0;
      const cycleVelocity = workload.members.length
        ? (
            workload.members.reduce((total, member) => total + member.completedTasks, 0) /
            workload.members.length
          ).toFixed(1)
        : "0.0";

      return {
        kpis: [
          {
            title: "Cycle Velocity",
            value: cycleVelocity,
            subtitle: "completed tasks / member",
            neutral: true,
          },
          {
            title: "Open Issues",
            value: openIssues.toString(),
            subtitle: `across ${projects.length} projects`,
            neutral: true,
          },
          {
            title: "Completed",
            value: completedTasks.toString(),
            subtitle: "workspace tasks finished",
            neutral: true,
          },
          {
            title: "Team Capacity",
            value: `${teamCapacity}%`,
            subtitle: `${activeMembers} of ${workload.members.length} members active`,
            neutral: true,
          },
        ],
        myWork: activeTasks.slice(0, 4).map(mapTask),
        triage: activeTasks.slice(0, 5).map(mapTask),
        projectHealth: projects.slice(0, 4).map((project) => ({
          name: project.name,
          health: getProjectHealth(project),
          progress:
            project.taskCount > 0
              ? Math.round((project.completedTaskCount / project.taskCount) * 100)
              : 0,
          tasks: `${project.completedTaskCount}/${project.taskCount}`,
        })),
        activity: notifications.slice(0, 4).map((notification: NotificationResponse) => ({
          id: notification.id,
          title: notification.actor
            ? `${notification.actor.fullName} • ${notification.title}`
            : notification.title,
          snippet: notification.body,
          timeLabel: formatDistanceToNowStrict(parseISO(notification.createdAt), {
            addSuffix: true,
          }),
          tone: getActivityTone(notification.type),
        })),
      };
    },
  });
}
