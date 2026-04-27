"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type {
  AnalyticsReportType,
  ProjectResponse,
  TaskResponse,
  VelocityResponse,
  WorkloadResponse,
} from "@/lib/api/contracts";
import {
  LIVE_REPORT_CATALOG,
  type ChartDataPoint,
  type LiveReportId,
  type ReportData,
  type ReportProject,
  type ReportProjectOwner,
} from "@/components/reports/data";

const TASK_DONE_STATUSES = new Set(["Done", "Cancelled", "4", "5"]);

function reportsQueryKey(workspaceId: string | null) {
  return ["reports", workspaceId] as const;
}

function reportsProjectsQueryKey(workspaceId: string | null) {
  return [...reportsQueryKey(workspaceId), "projects"] as const;
}

function reportsTasksQueryKey(workspaceId: string | null) {
  return [...reportsQueryKey(workspaceId), "tasks"] as const;
}

function reportsVelocityQueryKey(workspaceId: string | null) {
  return [...reportsQueryKey(workspaceId), "velocity"] as const;
}

function reportsWorkloadQueryKey(workspaceId: string | null) {
  return [...reportsQueryKey(workspaceId), "workload"] as const;
}

const REPORT_TASK_PAGE_SIZE = 100;
const REPORT_TASK_MAX_PAGES = 5;

type ReportQueryState = {
  isLoading: boolean;
  error: Error | null;
  isAvailable: boolean;
};

function normalizeProjectStatus(status: ProjectResponse["status"]): ReportProject["status"] {
  if (status === "Completed" || status === 2) return "completed";
  if (status === "Paused" || status === 1) return "at-risk";
  if (status === "Archived" || status === 3) return "off-track";
  return "on-track";
}

function normalizeTaskStatus(status: TaskResponse["status"]) {
  if (status === "Done" || status === 4) return "done";
  if (status === "Cancelled" || status === 5) return "cancelled";
  if (status === "InProgress" || status === 2 || status === "InReview" || status === 3) {
    return "in-progress";
  }

  return "planned";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function toOwner(project: ProjectResponse): ReportProjectOwner {
  const name = project.lead?.fullName ?? "Unassigned";
  return {
    name,
    initials: getInitials(name || project.name),
    avatar: project.lead?.avatarUrl ?? undefined,
  };
}

function buildProjectHealthChart(tasks: TaskResponse[]): ChartDataPoint[] {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  return days.map((date) => {
    const label = date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
    const dayKey = date.toISOString().slice(0, 10);

    const completed = tasks.filter(
      (task) => task.completedAt && task.completedAt.slice(0, 10) === dayKey,
    ).length;
    const added = tasks.filter((task) => task.createdAt.slice(0, 10) === dayKey).length;
    const overdue = tasks.filter((task) => {
      if (!task.dueDate) return false;
      if (TASK_DONE_STATUSES.has(String(task.status))) return false;
      return task.dueDate < dayKey;
    }).length;

    return {
      date: label,
      completed,
      added,
      atRisk: overdue,
    };
  });
}

function buildProjectRows(projects: ProjectResponse[], tasks: TaskResponse[]): ReportProject[] {
  return projects
    .map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      const overdueTasks = projectTasks.filter((task) => {
        if (!task.dueDate) return false;
        if (TASK_DONE_STATUSES.has(String(task.status))) return false;
        return task.dueDate < new Date().toISOString().slice(0, 10);
      }).length;

      const totalTasks = Math.max(project.taskCount, projectTasks.length, 1);
      const progress = Math.min(
        100,
        Math.round((project.completedTaskCount / totalTasks) * 100),
      );
      const status: ReportProject["status"] = normalizeProjectStatus(project.status);
      const healthPenalty = overdueTasks * 8 + (status === "at-risk" ? 12 : 0) + (status === "off-track" ? 25 : 0);
      const healthScore = Math.max(25, Math.min(100, progress + 35 - healthPenalty));

      return {
        id: project.id,
        name: project.name,
        status,
        progress,
        owner: toOwner(project),
        dueDate:
          project.targetDate ??
          project.updatedAt,
        healthScore,
      };
    })
    .sort((left, right) => right.healthScore - left.healthScore);
}

function buildProjectHealthReport(projects: ProjectResponse[], tasks: TaskResponse[]): ReportData {
  const activeProjects = projects.filter(
    (project) => project.status === "Active" || project.status === 0,
  ).length;
  const completedTasks = tasks.filter((task) => normalizeTaskStatus(task.status) === "done").length;
  const overdueTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    if (TASK_DONE_STATUSES.has(String(task.status))) return false;
    return task.dueDate < new Date().toISOString().slice(0, 10);
  }).length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const averageTasksPerProject =
    projects.length > 0 ? Math.round(tasks.length / projects.length) : 0;
  const lastUpdatedCandidates = [
    ...projects.map((project) => project.updatedAt),
    ...tasks.map((task) => task.updatedAt),
  ].sort();

  return {
    id: "project-health",
    title: "Project Delivery Overview",
    category: "overview",
    description:
      "Live workspace snapshot derived from persisted projects and tasks. Health scores are inferred from progress, status, and overdue work until a dedicated reports domain ships.",
    lastUpdated:
      lastUpdatedCandidates[lastUpdatedCandidates.length - 1] ?? new Date().toISOString(),
    kpis: [
      {
        id: "active-projects",
        label: "Active Projects",
        value: activeProjects,
        format: "number",
        trend: {
          value: `${projects.length}`,
          direction: "flat",
          sentiment: "neutral",
          label: "workspace projects in scope",
        },
      },
      {
        id: "task-completion-rate",
        label: "Task Completion",
        value: completionRate,
        format: "percentage",
        trend: {
          value: `${completedTasks}`,
          direction: completionRate >= 70 ? "up" : "flat",
          sentiment: completionRate >= 70 ? "positive" : "neutral",
          label: "completed tasks",
        },
      },
      {
        id: "overdue-open-work",
        label: "Overdue Open Tasks",
        value: overdueTasks,
        format: "number",
        trend: {
          value: overdueTasks === 0 ? "0" : `${overdueTasks}`,
          direction: overdueTasks === 0 ? "flat" : "up",
          sentiment: overdueTasks === 0 ? "positive" : "negative",
          label: "requires intervention",
        },
      },
      {
        id: "avg-tasks-per-project",
        label: "Avg Tasks / Project",
        value: averageTasksPerProject,
        format: "number",
        trend: {
          value: `${tasks.length}`,
          direction: "flat",
          sentiment: "neutral",
          label: "tracked tasks total",
        },
      },
    ],
    chartData: buildProjectHealthChart(tasks),
    projects: buildProjectRows(projects, tasks),
  };
}

function buildVelocityReport(velocity: VelocityResponse): ReportData {
  const totalCompletedPoints = velocity.sprints.reduce(
    (sum, sprint) => sum + (sprint.completedPoints ?? 0),
    0,
  );
  const totalPlannedPoints = velocity.sprints.reduce(
    (sum, sprint) => sum + (sprint.plannedPoints ?? 0),
    0,
  );
  const completionRate =
    totalPlannedPoints > 0
      ? Math.round((totalCompletedPoints / totalPlannedPoints) * 100)
      : 0;

  return {
    id: "team-velocity",
    title: "Team Velocity & Throughput",
    category: "delivery",
    description:
      "Live sprint delivery report from the analytics module. This view uses completed sprint velocity and planned capacity, not saved ad-hoc report definitions.",
    lastUpdated: new Date().toISOString(),
    kpis: [
      {
        id: "avg-velocity",
        label: "Avg Velocity (pts)",
        value: Math.round(velocity.averageVelocity),
        format: "number",
        trend: {
          value: `${velocity.sprints.length}`,
          direction: "flat",
          sentiment: "neutral",
          label: "completed sprints sampled",
        },
      },
      {
        id: "completed-points",
        label: "Completed Points",
        value: totalCompletedPoints,
        format: "number",
        trend: {
          value: `${completionRate}%`,
          direction: completionRate >= 80 ? "up" : "flat",
          sentiment: completionRate >= 80 ? "positive" : "neutral",
          label: "of planned sprint points",
        },
      },
      {
        id: "planned-points",
        label: "Planned Points",
        value: totalPlannedPoints,
        format: "number",
        trend: {
          value: `${Math.max(totalPlannedPoints - totalCompletedPoints, 0)}`,
          direction: totalCompletedPoints > totalPlannedPoints ? "down" : "flat",
          sentiment: "neutral",
          label: "points not completed",
        },
      },
    ],
    chartData: velocity.sprints.map((sprint) => ({
      date: sprint.name,
      velocity: sprint.completedPoints ?? 0,
      capacity: sprint.plannedPoints ?? 0,
    })),
    projects: [],
  };
}

function buildWorkloadReport(workload: WorkloadResponse): ReportData {
  const assignedTasks = workload.members.reduce((sum, member) => sum + member.assignedTasks, 0);
  const completedTasks = workload.members.reduce((sum, member) => sum + member.completedTasks, 0);
  const totalHours = workload.members.reduce((sum, member) => sum + member.totalHoursLogged, 0);
  const averageCompletion =
    assignedTasks > 0 ? Math.round((completedTasks / assignedTasks) * 100) : 0;

  return {
    id: "workload",
    title: "Team Workload Snapshot",
    category: "workload",
    description:
      "Live aggregate workload from the analytics module. Capacity planning and date-sliced allocations are still pending a richer workload contract.",
    lastUpdated: new Date().toISOString(),
    kpis: [
      {
        id: "members-with-work",
        label: "Members In Scope",
        value: workload.members.length,
        format: "number",
        trend: {
          value: `${assignedTasks}`,
          direction: "flat",
          sentiment: "neutral",
          label: "assigned tasks total",
        },
      },
      {
        id: "tasks-assigned",
        label: "Assigned Tasks",
        value: assignedTasks,
        format: "number",
        trend: {
          value: `${completedTasks}`,
          direction: "flat",
          sentiment: "neutral",
          label: "completed by current assignees",
        },
      },
      {
        id: "hours-logged",
        label: "Hours Logged",
        value: totalHours.toFixed(1),
        format: "number",
        trend: {
          value: `${workload.members.length}`,
          direction: "flat",
          sentiment: "neutral",
          label: "workspace members contributing",
        },
      },
      {
        id: "completion-rate",
        label: "Completion Rate",
        value: averageCompletion,
        format: "percentage",
        trend: {
          value: `${averageCompletion}%`,
          direction: averageCompletion >= 70 ? "up" : "flat",
          sentiment: averageCompletion >= 70 ? "positive" : "neutral",
          label: "completed / assigned",
        },
      },
    ],
    chartData: workload.members.map((member) => ({
      date: member.fullName,
      assigned: member.assignedTasks,
      completed: member.completedTasks,
      hours: Number(member.totalHoursLogged),
      points: member.totalPoints,
    })),
    projects: [],
  };
}

export function useReportsData(selectedReportId: LiveReportId) {
  const { apiClient } = useAuth();
  const { activeWorkspaceId } = useWorkspace();

  const projectsQuery = useQuery({
    queryKey: reportsProjectsQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () =>
      apiClient.listProjects({
        page: 1,
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      }),
  });

  const tasksQuery = useQuery({
    queryKey: reportsTasksQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const taskPages: TaskResponse[][] = [];

      for (let page = 1; page <= REPORT_TASK_MAX_PAGES; page += 1) {
        const pageTasks = await apiClient.listTasks({
          page,
          pageSize: REPORT_TASK_PAGE_SIZE,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        taskPages.push(pageTasks);

        if (pageTasks.length < REPORT_TASK_PAGE_SIZE) {
          break;
        }
      }

      return taskPages.flat();
    },
  });

  const velocityQuery = useQuery({
    queryKey: reportsVelocityQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => apiClient.getVelocity({ sprintCount: 6 }),
  });

  const workloadQuery = useQuery({
    queryKey: reportsWorkloadQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => apiClient.getWorkload(),
  });

  const projectHealthReport = useMemo(
    () =>
      projectsQuery.data && tasksQuery.data
        ? buildProjectHealthReport(projectsQuery.data, tasksQuery.data)
        : null,
    [projectsQuery.data, tasksQuery.data],
  );

  const velocityReport = useMemo(
    () => (velocityQuery.data ? buildVelocityReport(velocityQuery.data) : null),
    [velocityQuery.data],
  );

  const workloadReport = useMemo(
    () => (workloadQuery.data ? buildWorkloadReport(workloadQuery.data) : null),
    [workloadQuery.data],
  );

  const reports = useMemo(
    () =>
      [projectHealthReport, velocityReport, workloadReport].filter(
        (report): report is ReportData => report !== null,
      ),
    [projectHealthReport, velocityReport, workloadReport],
  );

  const reportMap = useMemo(
    () =>
      ({
        "project-health": projectHealthReport,
        "team-velocity": velocityReport,
        workload: workloadReport,
      }) satisfies Record<LiveReportId, ReportData | null>,
    [projectHealthReport, velocityReport, workloadReport],
  );

  const reportStates = useMemo<Record<LiveReportId, ReportQueryState>>(
    () => ({
      "project-health": {
        isLoading: projectsQuery.isLoading || tasksQuery.isLoading,
        error: (projectsQuery.error as Error | null) ?? (tasksQuery.error as Error | null) ?? null,
        isAvailable: projectHealthReport !== null,
      },
      "team-velocity": {
        isLoading: velocityQuery.isLoading,
        error: (velocityQuery.error as Error | null) ?? null,
        isAvailable: velocityReport !== null,
      },
      workload: {
        isLoading: workloadQuery.isLoading,
        error: (workloadQuery.error as Error | null) ?? null,
        isAvailable: workloadReport !== null,
      },
    }),
    [
      projectHealthReport,
      projectsQuery.error,
      projectsQuery.isLoading,
      tasksQuery.error,
      tasksQuery.isLoading,
      velocityQuery.error,
      velocityQuery.isLoading,
      velocityReport,
      workloadQuery.error,
      workloadQuery.isLoading,
      workloadReport,
    ],
  );

  const activeReport = reportMap[selectedReportId] ?? null;
  const selectedReportState = reportStates[selectedReportId];

  const exportReport = async (reportId: LiveReportId) => {
    const reportTypeById: Record<LiveReportId, AnalyticsReportType> = {
      "project-health": "tasks",
      "team-velocity": "velocity",
      workload: "workload",
    };
    const csv = await apiClient.exportAnalyticsReport({
      format: "csv",
      reportType: reportTypeById[reportId],
    });

    if (typeof window !== "undefined") {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportId}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return {
    catalog: LIVE_REPORT_CATALOG,
    reports,
    activeReport,
    projectsQuery,
    tasksQuery,
    velocityQuery,
    workloadQuery,
    selectedReportState,
    exportReport,
  };
}
