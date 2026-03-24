"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HubConnection } from "@microsoft/signalr";
import { useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtime } from "@/contexts/realtime-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type { ProjectResponse } from "@/lib/api/contracts";
import type {
  TaskCommentResponse,
  TaskChecklistItemResponse,
  TaskWatcherResponse,
  FileAttachmentResponse,
} from "@/lib/api/client";
import {
  BOARD_STATUSES,
  type BoardTask,
  type BoardTaskPriority,
  type BoardTaskStatus,
  type BoardUser,
  toBoardTask,
  toBoardUser,
  toCreateTaskRequest,
  toUpdateTaskRequest,
  denormalizeTaskStatus,
} from "@/components/board/types";

function tasksQueryKey(workspaceId: string | null) {
  return ["board", workspaceId, "tasks"] as const;
}

function projectsQueryKey(workspaceId: string | null) {
  return ["board", workspaceId, "projects"] as const;
}

function membersQueryKey(workspaceId: string | null) {
  return ["board", workspaceId, "members"] as const;
}

function taskCommentsQueryKey(workspaceId: string | null, taskId: string | null) {
  return ["board", workspaceId, "tasks", taskId, "comments"] as const;
}

function taskChecklistQueryKey(workspaceId: string | null, taskId: string | null) {
  return ["board", workspaceId, "tasks", taskId, "checklist"] as const;
}

function taskWatchersQueryKey(workspaceId: string | null, taskId: string | null) {
  return ["board", workspaceId, "tasks", taskId, "watchers"] as const;
}

function taskAttachmentsQueryKey(workspaceId: string | null, taskId: string | null) {
  return ["board", workspaceId, "tasks", taskId, "attachments"] as const;
}

type BoardHubPayload =
  | string
  | {
      taskId?: string;
      id?: string;
      projectId?: string;
    };

function resolveTaskId(payload: BoardHubPayload) {
  if (typeof payload === "string") {
    return payload;
  }

  return payload.taskId ?? payload.id ?? null;
}

export interface BoardCreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  assigneeId?: string;
  dueDate?: string;
  tags: string[];
}

export function useBoardData(selectedTaskId?: string | null) {
  const { apiClient, session } = useAuth();
  const { connect } = useRealtime();
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const currentUser = session?.user ?? null;
  const selectedTaskIdRef = useRef<string | null>(selectedTaskId ?? null);

  const tasksQuery = useQuery<BoardTask[]>({
    queryKey: tasksQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 15_000,
    queryFn: async () => {
      const tasks = await apiClient.listTasks({
        pageSize: 100,
        sortBy: "sortOrder",
        sortOrder: "asc",
      });

      return tasks
        .map((task) => toBoardTask(task))
        .filter((task): task is BoardTask => task !== null);
    },
  });

  const projectsQuery = useQuery<ProjectResponse[]>({
    queryKey: projectsQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () =>
      apiClient.listProjects({
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      }),
  });

  const membersQuery = useQuery<BoardUser[]>({
    queryKey: membersQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const members = await apiClient.listWorkspaceMembers(activeWorkspaceId!);
      return members
        .map((member) => toBoardUser(member))
        .filter((member): member is BoardUser => member !== null);
    },
  });

  // ─── Task subresource queries (only when a task is selected) ──────────────

  const commentsQuery = useQuery<TaskCommentResponse[]>({
    queryKey: taskCommentsQueryKey(activeWorkspaceId, selectedTaskId ?? null),
    enabled: !!selectedTaskId && !!activeWorkspaceId,
    staleTime: 10_000,
    queryFn: () => apiClient.listTaskComments(selectedTaskId!),
  });

  const checklistQuery = useQuery<TaskChecklistItemResponse[]>({
    queryKey: taskChecklistQueryKey(activeWorkspaceId, selectedTaskId ?? null),
    enabled: !!selectedTaskId && !!activeWorkspaceId,
    staleTime: 10_000,
    queryFn: () => apiClient.listTaskChecklist(selectedTaskId!),
  });

  const watchersQuery = useQuery<TaskWatcherResponse[]>({
    queryKey: taskWatchersQueryKey(activeWorkspaceId, selectedTaskId ?? null),
    enabled: !!selectedTaskId && !!activeWorkspaceId,
    staleTime: 10_000,
    queryFn: () => apiClient.listTaskWatchers(selectedTaskId!),
  });

  const attachmentsQuery = useQuery<FileAttachmentResponse[]>({
    queryKey: taskAttachmentsQueryKey(activeWorkspaceId, selectedTaskId ?? null),
    enabled: !!selectedTaskId && !!activeWorkspaceId,
    staleTime: 10_000,
    queryFn: () => apiClient.listTaskAttachments(selectedTaskId!),
  });

  const projectIds = useMemo(
    () => Array.from(new Set((projectsQuery.data ?? []).map((project) => project.id))).sort(),
    [projectsQuery.data],
  );

  useEffect(() => {
    selectedTaskIdRef.current = selectedTaskId ?? null;
  }, [selectedTaskId]);

  useEffect(() => {
    if (!activeWorkspaceId || projectIds.length === 0) {
      return;
    }

    let disposed = false;
    let connection: HubConnection | null = null;
    let joinedProjectIds: string[] = [];

    const invalidateBoardData = (payload: BoardHubPayload) => {
      const taskId = resolveTaskId(payload);
      void queryClient.invalidateQueries({ queryKey: tasksQueryKey(activeWorkspaceId) });

      if (taskId && taskId === selectedTaskIdRef.current) {
        void Promise.all([
          queryClient.invalidateQueries({
            queryKey: taskCommentsQueryKey(activeWorkspaceId, taskId),
          }),
          queryClient.invalidateQueries({
            queryKey: taskChecklistQueryKey(activeWorkspaceId, taskId),
          }),
          queryClient.invalidateQueries({
            queryKey: taskWatchersQueryKey(activeWorkspaceId, taskId),
          }),
          queryClient.invalidateQueries({
            queryKey: taskAttachmentsQueryKey(activeWorkspaceId, taskId),
          }),
        ]);
      }
    };

    const handleTaskCreated = (payload: BoardHubPayload) => invalidateBoardData(payload);
    const handleTaskUpdated = (payload: BoardHubPayload) => invalidateBoardData(payload);
    const handleTaskMoved = (payload: BoardHubPayload) => invalidateBoardData(payload);
    const handleTaskDeleted = (payload: BoardHubPayload) => invalidateBoardData(payload);

    const start = async () => {
      connection = await connect("/hubs/board");
      if (disposed) {
        return;
      }

      connection.on("TaskCreated", handleTaskCreated);
      connection.on("TaskUpdated", handleTaskUpdated);
      connection.on("TaskMoved", handleTaskMoved);
      connection.on("TaskDeleted", handleTaskDeleted);

      for (const projectId of projectIds) {
        await connection.invoke("JoinBoard", projectId);
      }

      joinedProjectIds = projectIds;
    };

    void start();

    return () => {
      disposed = true;

      if (!connection) {
        return;
      }

      connection.off("TaskCreated", handleTaskCreated);
      connection.off("TaskUpdated", handleTaskUpdated);
      connection.off("TaskMoved", handleTaskMoved);
      connection.off("TaskDeleted", handleTaskDeleted);

      void Promise.all(
        joinedProjectIds.map((projectId) =>
          connection!.invoke("LeaveBoard", projectId).catch(() => undefined),
        ),
      );
    };
  }, [activeWorkspaceId, connect, projectIds, queryClient]);

  // ─── Core task mutations ──────────────────────────────────────────────────

  const createTaskMutation = useMutation({
    mutationFn: async (input: BoardCreateTaskInput) =>
      apiClient.createTask(toCreateTaskRequest(input)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: tasksQueryKey(activeWorkspaceId),
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task: BoardTask) => apiClient.updateTask(task.id, toUpdateTaskRequest(task)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: tasksQueryKey(activeWorkspaceId),
      });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: BoardTaskStatus }) =>
      apiClient.updateTaskStatus(taskId, { status: denormalizeTaskStatus(status) }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey(activeWorkspaceId) });
      const previousTasks = queryClient.getQueryData<BoardTask[]>(tasksQueryKey(activeWorkspaceId));

      if (previousTasks) {
        queryClient.setQueryData<BoardTask[]>(
          tasksQueryKey(activeWorkspaceId),
          previousTasks.map((task) =>
            task.id === taskId ? { ...task, status, rawStatus: denormalizeTaskStatus(status) } : task,
          ),
        );
      }

      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksQueryKey(activeWorkspaceId), context.previousTasks);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: tasksQueryKey(activeWorkspaceId),
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => apiClient.deleteTask(taskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: tasksQueryKey(activeWorkspaceId),
      });
    },
  });

  // ─── Comment mutations ────────────────────────────────────────────────────

  const createCommentMutation = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) =>
      apiClient.createTaskComment(taskId, { content }),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({
        queryKey: taskCommentsQueryKey(activeWorkspaceId, taskId),
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async ({ taskId, commentId }: { taskId: string; commentId: string }) =>
      apiClient.deleteTaskComment(taskId, commentId),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({
        queryKey: taskCommentsQueryKey(activeWorkspaceId, taskId),
      });
    },
  });

  // ─── Checklist mutations ──────────────────────────────────────────────────

  const createChecklistItemMutation = useMutation({
    mutationFn: async ({ taskId, text }: { taskId: string; text: string }) =>
      apiClient.createTaskChecklistItem(taskId, { text }),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({
        queryKey: taskChecklistQueryKey(activeWorkspaceId, taskId),
      });
    },
  });

  const toggleChecklistItemMutation = useMutation({
    mutationFn: async ({
      taskId,
      itemId,
      isCompleted,
    }: {
      taskId: string;
      itemId: string;
      isCompleted: boolean;
    }) => apiClient.toggleTaskChecklistItem(taskId, itemId, { isCompleted }),
    onMutate: async ({ taskId, itemId, isCompleted }) => {
      const key = taskChecklistQueryKey(activeWorkspaceId, taskId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TaskChecklistItemResponse[]>(key);
      if (previous) {
        queryClient.setQueryData<TaskChecklistItemResponse[]>(
          key,
          previous.map((item) => (item.id === itemId ? { ...item, isCompleted } : item)),
        );
      }
      return { previous };
    },
    onError: (_error, { taskId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskChecklistQueryKey(activeWorkspaceId, taskId), context.previous);
      }
    },
    onSettled: async (_data, _error, { taskId }) => {
      await queryClient.invalidateQueries({
        queryKey: taskChecklistQueryKey(activeWorkspaceId, taskId),
      });
    },
  });

  const deleteChecklistItemMutation = useMutation({
    mutationFn: async ({ taskId, itemId }: { taskId: string; itemId: string }) =>
      apiClient.deleteTaskChecklistItem(taskId, itemId),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({
        queryKey: taskChecklistQueryKey(activeWorkspaceId, taskId),
      });
    },
  });

  // ─── Watcher mutations ────────────────────────────────────────────────────

  const addWatcherMutation = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) =>
      apiClient.addTaskWatcher(taskId, { userId }),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({
        queryKey: taskWatchersQueryKey(activeWorkspaceId, taskId),
      });
    },
  });

  const removeWatcherMutation = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) =>
      apiClient.removeTaskWatcher(taskId, userId),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({
        queryKey: taskWatchersQueryKey(activeWorkspaceId, taskId),
      });
    },
  });

  // ─── Attachment mutations ─────────────────────────────────────────────────

  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({
      taskId,
      file,
    }: {
      taskId: string;
      file: File;
    }) => apiClient.uploadTaskAttachment(taskId, file),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({
        queryKey: taskAttachmentsQueryKey(activeWorkspaceId, taskId),
      });
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async ({ taskId, attachmentId }: { taskId: string; attachmentId: string }) =>
      apiClient.deleteTaskAttachment(taskId, attachmentId),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({
        queryKey: taskAttachmentsQueryKey(activeWorkspaceId, taskId),
      });
    },
  });

  // ─────────────────────────────────────────────────────────────────────────

  const membersById = useMemo(
    () => new Map((membersQuery.data ?? []).map((member) => [member.id, member])),
    [membersQuery.data],
  );

  return {
    tasksQuery,
    projectsQuery,
    membersQuery,
    tasks: tasksQuery.data ?? [],
    projects: projectsQuery.data ?? [],
    members: membersQuery.data ?? [],
    membersById,
    boardStatuses: BOARD_STATUSES,
    currentUser,
    // subresource queries
    commentsQuery,
    checklistQuery,
    watchersQuery,
    attachmentsQuery,
    comments: commentsQuery.data ?? [],
    checklist: checklistQuery.data ?? [],
    watchers: watchersQuery.data ?? [],
    attachments: attachmentsQuery.data ?? [],
    // core mutations
    createTask: async (input: BoardCreateTaskInput) => createTaskMutation.mutateAsync(input),
    updateTask: async (task: BoardTask) => updateTaskMutation.mutateAsync(task),
    updateTaskStatus: async (taskId: string, status: BoardTaskStatus) =>
      updateTaskStatusMutation.mutateAsync({ taskId, status }),
    deleteTask: async (taskId: string) => deleteTaskMutation.mutateAsync(taskId),
    isSavingTask:
      createTaskMutation.isPending ||
      updateTaskMutation.isPending ||
      updateTaskStatusMutation.isPending ||
      deleteTaskMutation.isPending,
    // comment mutations
    createComment: async (taskId: string, content: string) =>
      createCommentMutation.mutateAsync({ taskId, content }),
    deleteComment: async (taskId: string, commentId: string) =>
      deleteCommentMutation.mutateAsync({ taskId, commentId }),
    isCommentPending: createCommentMutation.isPending || deleteCommentMutation.isPending,
    // checklist mutations
    createChecklistItem: async (taskId: string, text: string) =>
      createChecklistItemMutation.mutateAsync({ taskId, text }),
    toggleChecklistItem: async (taskId: string, itemId: string, isCompleted: boolean) =>
      toggleChecklistItemMutation.mutateAsync({ taskId, itemId, isCompleted }),
    deleteChecklistItem: async (taskId: string, itemId: string) =>
      deleteChecklistItemMutation.mutateAsync({ taskId, itemId }),
    isChecklistPending:
      createChecklistItemMutation.isPending ||
      toggleChecklistItemMutation.isPending ||
      deleteChecklistItemMutation.isPending,
    // watcher mutations
    addWatcher: async (taskId: string, userId: string) =>
      addWatcherMutation.mutateAsync({ taskId, userId }),
    removeWatcher: async (taskId: string, userId: string) =>
      removeWatcherMutation.mutateAsync({ taskId, userId }),
    isWatcherPending: addWatcherMutation.isPending || removeWatcherMutation.isPending,
    // attachment mutations
    uploadAttachment: async (
      taskId: string,
      file: File,
    ) => uploadAttachmentMutation.mutateAsync({ taskId, file }),
    deleteAttachment: async (taskId: string, attachmentId: string) =>
      deleteAttachmentMutation.mutateAsync({ taskId, attachmentId }),
    isAttachmentPending: uploadAttachmentMutation.isPending || deleteAttachmentMutation.isPending,
  };
}
