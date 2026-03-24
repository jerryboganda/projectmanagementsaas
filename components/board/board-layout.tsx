"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { DropResult } from "@hello-pangea/dnd";
import { ArrowRightLeft, ChevronDown, LayoutGrid, Signal, Trash2, UserCircle, X } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { BoardToolbar } from "./board-toolbar";
import { BoardSurface } from "./board-surface";
import { TaskDetail } from "./task-detail";
import { CreateTaskModal } from "./create-task-modal";
import { buildBoardData, type BoardData } from "./data";
import { BOARD_PRIORITIES, type BoardTask, type BoardTaskPriority, type BoardTaskStatus } from "@/components/board/types";
import { useBoardData } from "@/hooks/use-board-data";

export function BoardLayout() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const {
    tasksQuery,
    projectsQuery,
    membersQuery,
    tasks,
    projects,
    members,
    membersById,
    currentUser,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    isSavingTask,
    comments,
    checklist,
    watchers,
    attachments,
    commentsQuery,
    checklistQuery,
    watchersQuery,
    attachmentsQuery,
    createComment,
    deleteComment,
    isCommentPending,
    createChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    isChecklistPending,
    addWatcher,
    removeWatcher,
    isWatcherPending,
    uploadAttachment,
    deleteAttachment,
    isAttachmentPending,
  } = useBoardData(selectedTaskId);

  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [groupBy, setGroupBy] = useState<string>("None");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<BoardTaskStatus>("To Do");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleClosePanel = () => setSelectedTaskId(null);
    const handleOpenCreate = () => {
      setCreateStatus("To Do");
      setIsCreateModalOpen(true);
    };

    window.addEventListener("close-panel", handleClosePanel);
    window.addEventListener("open-create-task", handleOpenCreate);
    return () => {
      window.removeEventListener("close-panel", handleClosePanel);
      window.removeEventListener("open-create-task", handleOpenCreate);
    };
  }, []);

  useEffect(() => {
    if (!openDropdown) return;
    const handleClick = () => setOpenDropdown(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [openDropdown]);

  const boardData = useMemo<BoardData>(() => buildBoardData(tasks), [tasks]);

  const handleToggleSelect = useCallback((taskId: string) => {
    setSelectedTaskIds((previous) => {
      const next = new Set(previous);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const selectedTasks = useMemo(
    () => tasks.filter((task) => selectedTaskIds.has(task.id)),
    [tasks, selectedTaskIds],
  );

  const handleBulkDelete = useCallback(async () => {
    await Promise.all(Array.from(selectedTaskIds).map((taskId) => deleteTask(taskId)));
    setSelectedTaskIds(new Set());
    if (selectedTaskId && selectedTaskIds.has(selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [deleteTask, selectedTaskId, selectedTaskIds]);

  const handleBulkStatusChange = useCallback(
    async (status: BoardTaskStatus) => {
      await Promise.all(
        selectedTasks.map((task) => updateTaskStatus(task.id, status)),
      );
      setSelectedTaskIds(new Set());
      setOpenDropdown(null);
    },
    [selectedTasks, updateTaskStatus],
  );

  const handleBulkPriorityChange = useCallback(
    async (priority: BoardTaskPriority) => {
      await Promise.all(
        selectedTasks.map((task) => updateTask({ ...task, priority })),
      );
      setSelectedTaskIds(new Set());
      setOpenDropdown(null);
    },
    [selectedTasks, updateTask],
  );

  const handleBulkAssigneeChange = useCallback(
    async (assigneeId?: string) => {
      await Promise.all(
        selectedTasks.map((task) => updateTask({ ...task, assigneeId })),
      );
      setSelectedTaskIds(new Set());
      setOpenDropdown(null);
    },
    [selectedTasks, updateTask],
  );

  const filteredData = useMemo(() => {
    let filteredTasks = { ...boardData.tasks };

    Object.values(filteredTasks).forEach((task) => {
      let matches = true;

      if (searchQuery) {
        matches =
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.identifier.toLowerCase().includes(searchQuery.toLowerCase());
      }

      if (assigneeFilter !== "All") {
        if (assigneeFilter === "Unassigned") {
          matches = matches && !task.assigneeId;
        } else if (assigneeFilter === "Me") {
          matches = matches && task.assigneeId === currentUser?.id;
        }
      }

      if (priorityFilter !== "All") {
        matches = matches && task.priority === priorityFilter;
      }

      if (!matches) {
        delete filteredTasks[task.id];
      }
    });

    if (groupBy === "None") {
      const filteredColumns = { ...boardData.columns };
      Object.keys(filteredColumns).forEach((columnId) => {
        filteredColumns[columnId] = {
          ...filteredColumns[columnId],
          taskIds: filteredColumns[columnId].taskIds.filter((taskId) => filteredTasks[taskId]),
        };
      });

      return {
        ...boardData,
        tasks: filteredTasks,
        columns: filteredColumns,
      };
    }

    const groupedColumns: Record<string, { id: string; title: string; taskIds: string[] }> = {};
    const groupedColumnOrder: string[] = [];

    if (groupBy === "Priority") {
      BOARD_PRIORITIES.forEach((priority) => {
        groupedColumns[priority] = { id: priority, title: priority, taskIds: [] };
        groupedColumnOrder.push(priority);
      });

      Object.values(filteredTasks).forEach((task) => {
        groupedColumns[task.priority]?.taskIds.push(task.id);
      });
    } else if (groupBy === "Assignee") {
      groupedColumns.Unassigned = { id: "Unassigned", title: "Unassigned", taskIds: [] };
      groupedColumnOrder.push("Unassigned");

      Object.values(filteredTasks).forEach((task) => {
        const assigneeName = task.assigneeId ? membersById.get(task.assigneeId)?.name ?? "Unassigned" : "Unassigned";
        if (!groupedColumns[assigneeName]) {
          groupedColumns[assigneeName] = { id: assigneeName, title: assigneeName, taskIds: [] };
          groupedColumnOrder.push(assigneeName);
        }
        groupedColumns[assigneeName].taskIds.push(task.id);
      });
    } else if (groupBy === "Project") {
      Object.values(filteredTasks).forEach((task) => {
        const projectName = projects.find((project) => project.id === task.projectId)?.name ?? "Workspace";
        if (!groupedColumns[projectName]) {
          groupedColumns[projectName] = { id: projectName, title: projectName, taskIds: [] };
          groupedColumnOrder.push(projectName);
        }
        groupedColumns[projectName].taskIds.push(task.id);
      });
    }

    return {
      tasks: filteredTasks,
      columns: groupedColumns,
      columnOrder: groupedColumnOrder,
    };
  }, [assigneeFilter, boardData, currentUser?.id, groupBy, membersById, priorityFilter, projects, searchQuery]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (groupBy !== "None" || type === "column") return;
    if (destination.droppableId === source.droppableId) return;

    await updateTaskStatus(draggableId, destination.droppableId as BoardTaskStatus);
  };

  const selectedTask = selectedTaskId ? boardData.tasks[selectedTaskId] ?? null : null;
  const selectionCount = selectedTaskIds.size;
  const isLoading = tasksQuery.isLoading || projectsQuery.isLoading || membersQuery.isLoading;
  const canCreateTasks = projects.length > 0;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background-dark">
      {selectionCount > 0 ? (
        <div className="z-20 flex items-center gap-3 border-b border-primary/20 bg-primary/10 px-4 py-2.5 backdrop-blur-sm">
          <span className="text-[13px] font-medium text-primary">
            {selectionCount} task{selectionCount > 1 ? "s" : ""} selected
          </span>

          <div className="h-4 w-px bg-primary/20" />

          <DropdownButton label="Status" icon={ArrowRightLeft} openKey="status" openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}>
            {["To Do", "In Progress", "In Review", "Done"].map((status) => (
              <button key={status} onClick={() => void handleBulkStatusChange(status as BoardTaskStatus)} className="w-full px-3 py-1.5 text-left text-[12px] text-slate-300 transition-colors hover:bg-white/[0.05]">
                {status}
              </button>
            ))}
          </DropdownButton>

          <DropdownButton label="Priority" icon={Signal} openKey="priority" openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}>
            {BOARD_PRIORITIES.map((priority) => (
              <button key={priority} onClick={() => void handleBulkPriorityChange(priority)} className="w-full px-3 py-1.5 text-left text-[12px] text-slate-300 transition-colors hover:bg-white/[0.05]">
                {priority}
              </button>
            ))}
          </DropdownButton>

          <DropdownButton label="Assignee" icon={UserCircle} openKey="assignee" openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}>
            <button onClick={() => void handleBulkAssigneeChange(undefined)} className="w-full px-3 py-1.5 text-left text-[12px] italic text-slate-400 transition-colors hover:bg-white/[0.05]">
              Unassigned
            </button>
            {members.map((member) => (
              <button key={member.id} onClick={() => void handleBulkAssigneeChange(member.id)} className="w-full px-3 py-1.5 text-left text-[12px] text-slate-300 transition-colors hover:bg-white/[0.05]">
                {member.name}
              </button>
            ))}
          </DropdownButton>

          <div className="h-4 w-px bg-primary/20" />

          <button onClick={() => void handleBulkDelete()} className="flex items-center gap-1.5 rounded border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-[12px] font-medium text-rose-400 transition-colors hover:bg-rose-500/20">
            <Trash2 className="size-3.5" />
            Delete {selectionCount}
          </button>

          <div className="flex-1" />

          <button onClick={() => setSelectedTaskIds(new Set())} className="flex items-center gap-1.5 rounded border border-neutral-border bg-white/[0.03] px-2.5 py-1.5 text-[12px] font-medium text-slate-400 transition-colors hover:border-neutral-border hover:text-slate-200">
            <X className="size-3.5" />
            Clear selection
          </button>
        </div>
      ) : null}

      <BoardToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        taskCount={Object.keys(filteredData.tasks).length}
        onNewTask={() => {
          setCreateStatus("To Do");
          setIsCreateModalOpen(true);
        }}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {isLoading && tasks.length === 0 ? (
            <EmptyState icon={LayoutGrid} title="Loading board..." description="Fetching live tasks, projects, and workspace members." />
          ) : !canCreateTasks ? (
            <EmptyState icon={LayoutGrid} title="Create a project first" description="Tasks are persisted through the backend, so the live board needs at least one project before you can create work." />
          ) : Object.keys(filteredData.tasks).length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title={searchQuery || assigneeFilter !== "All" || priorityFilter !== "All" ? "No tasks match your filters" : "No tasks yet"}
              description={searchQuery || assigneeFilter !== "All" || priorityFilter !== "All" ? "Try adjusting your search or filter criteria." : "Create your first task to get started with the board."}
              actionLabel="New Task"
              onAction={() => {
                setCreateStatus("To Do");
                setIsCreateModalOpen(true);
              }}
            />
          ) : (
            <BoardSurface
              data={filteredData}
              membersById={membersById}
              onDragEnd={(result) => void handleDragEnd(result)}
              selectedTaskId={selectedTaskId}
              onTaskSelect={setSelectedTaskId}
              onCreateTask={(status) => {
                setCreateStatus(status);
                setIsCreateModalOpen(true);
              }}
              isDragDisabled={groupBy !== "None"}
              selectedTaskIds={selectedTaskIds}
              onToggleSelect={handleToggleSelect}
            />
          )}
        </div>

        <AnimatePresence>
          {selectedTask ? (
            <TaskDetail
              task={selectedTask}
              users={members}
              projects={projects}
              isSaving={isSavingTask}
              onClose={() => setSelectedTaskId(null)}
              onSave={async (task) => {
                await updateTask(task);
              }}
              onDelete={async (taskId) => {
                await deleteTask(taskId);
                setSelectedTaskId(null);
              }}
              comments={comments}
              checklist={checklist}
              watchers={watchers}
              attachments={attachments}
              isLoadingComments={commentsQuery.isLoading}
              isLoadingChecklist={checklistQuery.isLoading}
              isLoadingWatchers={watchersQuery.isLoading}
              isLoadingAttachments={attachmentsQuery.isLoading}
              onCreateComment={(content) => createComment(selectedTask.id, content)}
              onDeleteComment={(commentId) => deleteComment(selectedTask.id, commentId)}
              isCommentPending={isCommentPending}
              onCreateChecklistItem={(text) => createChecklistItem(selectedTask.id, text)}
              onToggleChecklistItem={(itemId, isCompleted) => toggleChecklistItem(selectedTask.id, itemId, isCompleted)}
              onDeleteChecklistItem={(itemId) => deleteChecklistItem(selectedTask.id, itemId)}
              isChecklistPending={isChecklistPending}
              onAddWatcher={(userId) => addWatcher(selectedTask.id, userId)}
              onRemoveWatcher={(userId) => removeWatcher(selectedTask.id, userId)}
              isWatcherPending={isWatcherPending}
              onUploadAttachment={(file) => uploadAttachment(selectedTask.id, file)}
              onDeleteAttachment={(attachmentId) => deleteAttachment(selectedTask.id, attachmentId)}
              isAttachmentPending={isAttachmentPending}
            />
          ) : null}
        </AnimatePresence>
      </div>

      <CreateTaskModal
        key={`${isCreateModalOpen ? createStatus : "closed"}-${projects[0]?.id ?? "no-project"}`}
        isOpen={isCreateModalOpen}
        defaultStatus={createStatus}
        users={members}
        projects={projects}
        isSubmitting={isSavingTask}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={async (input) => {
          await createTask(input);
        }}
      />
    </div>
  );
}

function DropdownButton({
  label,
  icon: Icon,
  openKey,
  openDropdown,
  setOpenDropdown,
  children,
}: {
  label: string;
  icon: React.ElementType;
  openKey: string;
  openDropdown: string | null;
  setOpenDropdown: (key: string | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        onClick={(event) => {
          event.stopPropagation();
          setOpenDropdown(openDropdown === openKey ? null : openKey);
        }}
        className="flex items-center gap-1.5 rounded border border-neutral-border bg-white/[0.05] px-2.5 py-1.5 text-[12px] font-medium text-slate-300 transition-colors hover:border-primary/40"
      >
        <Icon className="size-3.5" />
        {label}
        <ChevronDown className="size-3" />
      </button>
      {openDropdown === openKey ? (
        <div onClick={(event) => event.stopPropagation()} className="absolute left-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border border-neutral-border bg-neutral-surface py-1 shadow-xl">
          {children}
        </div>
      ) : null}
    </div>
  );
}
