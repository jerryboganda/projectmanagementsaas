"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type { ProjectResponse, TaskResponse, WorkloadMember, WorkloadResponse } from "@/lib/api/contracts";
import {
  getInitials,
  getPriorityLabel,
  getPriorityTone,
  getProjectLabel,
  getTaskStatusLabel,
  getTaskStatusTone,
  getWorkloadTone,
  type WorkloadMemberView,
  type WorkloadProjectOption,
  type WorkloadSummaryStats,
  type WorkloadTaskView,
} from "@/components/workload/data";

function workloadQueryKey(workspaceId: string | null, projectId: string | null) {
  return ["workload", workspaceId, projectId] as const;
}

function workloadProjectsQueryKey(workspaceId: string | null) {
  return ["workload", workspaceId, "projects"] as const;
}

function workloadTasksQueryKey(workspaceId: string | null, projectId: string | null) {
  return ["workload", workspaceId, projectId, "tasks"] as const;
}

function buildTaskViews(tasks: TaskResponse[], projects: ProjectResponse[]) {
  const projectNameById = new Map(projects.map((project) => [project.id, getProjectLabel(project)]));

  return tasks
    .map<WorkloadTaskView>((task) => ({
      id: task.id,
      title: task.title,
      projectId: task.projectId,
      projectName: projectNameById.get(task.projectId) ?? "Unassigned project",
      assigneeId: task.assignee?.id ?? null,
      assigneeName: task.assignee?.fullName ?? null,
      priority: task.priority,
      status: task.status,
      estimateHours: task.estimateHours ?? null,
      estimatePoints: task.estimatePoints ?? null,
      dueDate: task.dueDate ?? null,
      completedAt: task.completedAt ?? null,
      labels: task.labels,
      updatedAt: task.updatedAt,
      isOverdue: false,
    }))
    .map((task) => ({
      ...task,
      isOverdue: task.dueDate ? task.dueDate < new Date().toISOString().slice(0, 10) && !task.completedAt : false,
    }))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function buildMemberView(member: WorkloadMember, tasks: WorkloadTaskView[]): WorkloadMemberView {
  const memberTasks = tasks.filter((task) => task.assigneeId === member.userId);
  const topProjects = Array.from(
    new Set(memberTasks.map((task) => task.projectName).filter(Boolean)),
  ).slice(0, 3);

  const topTasks = memberTasks.slice(0, 3).map((task) => task.title);
  const activeTaskCount = Math.max(member.assignedTasks - member.completedTasks, 0);
  const completionRate =
    member.assignedTasks > 0 ? Math.round((member.completedTasks / member.assignedTasks) * 100) : 0;

  return {
    ...member,
    id: member.userId,
    activeTaskCount,
    completionRate,
    workloadTone: getWorkloadTone({
      assignedTasks: member.assignedTasks,
      completedTasks: member.completedTasks,
      activeTaskCount,
      totalHoursLogged: Number(member.totalHoursLogged),
    }),
    topProjects,
    topTasks,
  };
}

export function useWorkloadData() {
  const { apiClient } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [preferredSelectedMemberId, setPreferredSelectedMemberId] = useState<string | null>(null);
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const projectsQuery = useQuery({
    queryKey: workloadProjectsQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () =>
      apiClient.listProjects({
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      }),
  });

  const workloadQuery = useQuery<WorkloadResponse>({
    queryKey: workloadQueryKey(activeWorkspaceId, selectedProjectId),
    enabled: !!activeWorkspaceId,
    staleTime: 15_000,
    queryFn: async () =>
      apiClient.getWorkload({
        projectId: selectedProjectId ?? undefined,
      }),
  });

  const tasksQuery = useQuery({
    queryKey: workloadTasksQueryKey(activeWorkspaceId, selectedProjectId),
    enabled: !!activeWorkspaceId,
    staleTime: 15_000,
    queryFn: async () =>
      apiClient.listTasks({
        projectId: selectedProjectId ?? undefined,
        pageSize: 200,
        sortBy: "updatedAt",
        sortOrder: "desc",
      }),
  });

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const tasks = useMemo(() => buildTaskViews(tasksQuery.data ?? [], projects), [tasksQuery.data, projects]);

  const projectOptions: WorkloadProjectOption[] = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id,
        label: project.name,
        identifier: project.identifier,
      })),
    [projects],
  );

  const members = useMemo(() => {
    const liveMembers = workloadQuery.data?.members ?? [];
    return liveMembers
      .map((member) => buildMemberView(member, tasks))
      .sort((left, right) => {
        if (right.activeTaskCount !== left.activeTaskCount) {
          return right.activeTaskCount - left.activeTaskCount;
        }

        if (right.totalHoursLogged !== left.totalHoursLogged) {
          return Number(right.totalHoursLogged) - Number(left.totalHoursLogged);
        }

        return left.fullName.localeCompare(right.fullName);
      });
  }, [tasks, workloadQuery.data?.members]);

  const summary: WorkloadSummaryStats = useMemo(
    () => ({
      totalMembers: members.length,
      activeMembers: members.filter((member) => member.assignedTasks > 0).length,
      assignedTasks: members.reduce((sum, member) => sum + member.assignedTasks, 0),
      completedTasks: members.reduce((sum, member) => sum + member.completedTasks, 0),
      totalPoints: members.reduce((sum, member) => sum + member.totalPoints, 0),
      totalHoursLogged: Number(
        members.reduce((sum, member) => sum + Number(member.totalHoursLogged), 0).toFixed(1),
      ),
      averageCompletionRate:
        members.reduce((sum, member) => sum + member.completionRate, 0) /
        Math.max(members.length, 1),
    }),
    [members],
  );

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return members;
    }

    return members.filter((member) => {
      const searchableText = [
        member.fullName,
        getInitials(member.fullName),
        member.topProjects.join(" "),
        member.topTasks.join(" "),
        member.assignedTasks,
        member.completedTasks,
        member.totalHoursLogged,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [members, searchQuery]);

  const selectedMemberId = useMemo(() => {
    if (!isMemberDetailOpen) {
      return null;
    }

    if (filteredMembers.length === 0) {
      return null;
    }

    if (
      preferredSelectedMemberId &&
      filteredMembers.some((member) => member.userId === preferredSelectedMemberId)
    ) {
      return preferredSelectedMemberId;
    }

    return filteredMembers[0].userId;
  }, [filteredMembers, preferredSelectedMemberId, isMemberDetailOpen]);

  const selectedMember = useMemo(
    () => members.find((member) => member.userId === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );

  const selectedMemberTasks = useMemo(() => {
    if (!selectedMember) {
      return [];
    }

    return tasks
      .filter((task) => task.assigneeId === selectedMember.userId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [selectedMember, tasks]);

  const isLoading = workloadQuery.isPending;
  const isRefreshing = workloadQuery.isFetching || tasksQuery.isFetching || projectsQuery.isFetching;
  const error = workloadQuery.error ?? null;

  return {
    activeWorkspaceId,
    projectOptions,
    selectedProjectId,
    setSelectedProjectId,
    searchQuery,
    setSearchQuery,
    members: filteredMembers,
    allMembers: members,
    summary,
    selectedMemberId,
    selectedMember,
    selectedMemberTasks,
    tasks,
    projects,
    isLoading,
    isRefreshing,
    error,
    refresh: async () => {
      await Promise.all([
        workloadQuery.refetch(),
        tasksQuery.refetch(),
        projectsQuery.refetch(),
      ]);
    },
    hasData: members.length > 0,
    hasFilteredResults: filteredMembers.length > 0,
    isWorkspaceReady: !!activeWorkspaceId,
    isMemberDetailOpen,
    workloadQuery,
    tasksQuery,
    projectsQuery,
    taskStatusLabel: getTaskStatusLabel,
    taskStatusTone: getTaskStatusTone,
    priorityLabel: getPriorityLabel,
    priorityTone: getPriorityTone,
    setSelectedMemberId: (memberId: string | null) => {
      setIsMemberDetailOpen(memberId !== null);
      setPreferredSelectedMemberId(memberId);
    },
  };
}
