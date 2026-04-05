"use client";

import { type ElementType, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  ListTodo,
  Package,
  Pencil,
  Plus,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { useSprintsData, type LiveSprintTask, type LiveSprint } from "@/hooks/use-sprints-data";
import type { CreateSprintRequest, UpdateSprintRequest } from "@/lib/api/contracts";
import type { BoardTaskStatus } from "@/components/board/types";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(startDate: string, endDate: string) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function daysRemaining(endDate: string) {
  const end = new Date(endDate).getTime();
  const diff = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "Ended";
  if (diff === 0) return "Ends today";
  return `${diff}d left`;
}

function SprintStatusBadge({ status }: { status: "planning" | "active" | "completed" | "cancelled" }) {
  const tone =
    status === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : status === "completed"
        ? "border-slate-500/30 bg-slate-500/10 text-slate-300"
        : status === "cancelled"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
          : "border-blue-500/30 bg-blue-500/10 text-blue-300";

  const label =
    status === "active"
      ? "Active"
      : status === "completed"
        ? "Completed"
        : status === "cancelled"
          ? "Cancelled"
          : "Planning";

  return (
    <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

function TaskCard({
  task,
  actionLabel,
  onAction,
  onAdvance,
}: {
  task: LiveSprintTask;
  actionLabel?: string;
  onAction?: () => void;
  onAdvance?: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-sm border border-neutral-border bg-neutral-surface p-3"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 size-2 shrink-0 rounded-full bg-primary/80" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500">{task.identifier}</span>
            <span className="rounded-sm border border-neutral-border/70 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-slate-400">
              {task.priority}
            </span>
          </div>
          <div className="mt-1 text-[13px] font-medium text-slate-200">{task.title}</div>
          {task.description ? (
            <p className="mt-1 line-clamp-2 text-[12px] text-slate-500">{task.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            {task.assignee ? (
              <span className="rounded-full border border-neutral-border bg-white/[0.03] px-2 py-0.5">
                {task.assignee.name}
              </span>
            ) : (
              <span className="rounded-full border border-neutral-border bg-white/[0.03] px-2 py-0.5">
                Unassigned
              </span>
            )}
            {task.dueDate ? (
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                {formatDate(task.dueDate)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {(onAction || onAdvance) ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1 rounded-sm border border-neutral-border bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06]"
            >
              <ArrowRight className="size-3" />
              {actionLabel}
            </button>
          ) : null}
          {onAdvance ? (
            <button
              type="button"
              onClick={onAdvance}
              className="rounded-sm border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Advance
            </button>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  );
}

function SprintColumn({
  title,
  icon: Icon,
  tasks,
  droppableId,
  actionLabel,
  onTaskAction,
  onTaskAdvance,
}: {
  title: string;
  icon: ElementType;
  tasks: LiveSprintTask[];
  droppableId: string;
  actionLabel?: string;
  onTaskAction?: (taskId: string) => void;
  onTaskAdvance?: (taskId: string) => void;
}) {
  return (
    <div className="flex min-w-[260px] flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <Icon className="size-4 text-slate-400" />
        <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-300">
          {title}
        </span>
        <span className="rounded-sm bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
          {tasks.length}
        </span>
      </div>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[60px] space-y-2 rounded-sm p-1 transition-colors",
              snapshot.isDraggingOver && "bg-primary/5 ring-1 ring-primary/20",
            )}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="rounded-sm border border-dashed border-neutral-border px-3 py-8 text-center text-[12px] text-slate-600">
                No tasks
              </div>
            ) : (
              tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={cn(dragSnapshot.isDragging && "opacity-90 shadow-lg")}
                    >
                      <TaskCard
                        task={task}
                        actionLabel={actionLabel}
                        onAction={onTaskAction ? () => onTaskAction(task.id) : undefined}
                        onAdvance={onTaskAdvance ? () => onTaskAdvance(task.id) : undefined}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function CreateSprintModal({
  isSubmitting,
  onClose,
  onCreate,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (input: CreateSprintRequest) => Promise<void>;
}) {
  const [defaults] = useState(() => {
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 14);

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  });
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-md rounded-sm border border-neutral-border bg-neutral-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-border px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-100">Create Sprint</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="size-4" />
          </button>
        </div>

        <form
          className="space-y-4 p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!name.trim()) return;
            await onCreate({
              name: name.trim(),
              goal: goal.trim() || null,
              startDate,
              endDate,
            });
            onClose();
          }}
        >
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Sprint Name
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-9 w-full rounded-sm border border-neutral-border bg-slate-800/50 px-3 text-[13px] text-slate-200 outline-none transition-colors focus:border-primary"
              placeholder="Sprint 27"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Goal
            </label>
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={3}
              className="w-full rounded-sm border border-neutral-border bg-slate-800/50 px-3 py-2 text-[13px] text-slate-200 outline-none transition-colors focus:border-primary"
              placeholder="What should this sprint accomplish?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-9 w-full rounded-sm border border-neutral-border bg-slate-800/50 px-3 text-[13px] text-slate-200 outline-none transition-colors focus:border-primary [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-9 w-full rounded-sm border border-neutral-border bg-slate-800/50 px-3 text-[13px] text-slate-200 outline-none transition-colors focus:border-primary [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-sm border border-neutral-border px-4 text-[12px] font-medium text-slate-400 transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="h-8 rounded-sm bg-primary px-4 text-[12px] font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create Sprint"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function EditSprintModal({
  sprint,
  isSubmitting,
  onClose,
  onSave,
}: {
  sprint: LiveSprint;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (input: UpdateSprintRequest) => Promise<void>;
}) {
  const [name, setName] = useState(sprint.name);
  const [goal, setGoal] = useState(sprint.goalDescription ?? "");
  const [startDate, setStartDate] = useState(sprint.startDate.slice(0, 10));
  const [endDate, setEndDate] = useState(sprint.endDate.slice(0, 10));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-md rounded-sm border border-neutral-border bg-neutral-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-border px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-100">Edit Sprint</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="size-4" />
          </button>
        </div>

        <form
          className="space-y-4 p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!name.trim()) return;
            await onSave({
              name: name.trim(),
              goal: goal.trim() || null,
              startDate,
              endDate,
            });
            onClose();
          }}
        >
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Sprint Name
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-9 w-full rounded-sm border border-neutral-border bg-slate-800/50 px-3 text-[13px] text-slate-200 outline-none transition-colors focus:border-primary"
              placeholder="Sprint 27"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Goal
            </label>
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={3}
              className="w-full rounded-sm border border-neutral-border bg-slate-800/50 px-3 py-2 text-[13px] text-slate-200 outline-none transition-colors focus:border-primary"
              placeholder="What should this sprint accomplish?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-9 w-full rounded-sm border border-neutral-border bg-slate-800/50 px-3 text-[13px] text-slate-200 outline-none transition-colors focus:border-primary [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-9 w-full rounded-sm border border-neutral-border bg-slate-800/50 px-3 text-[13px] text-slate-200 outline-none transition-colors focus:border-primary [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-sm border border-neutral-border px-4 text-[12px] font-medium text-slate-400 transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="h-8 rounded-sm bg-primary px-4 text-[12px] font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteSprintDialog({
  sprintName,
  isDeleting,
  onClose,
  onConfirm,
}: {
  sprintName: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-sm rounded-sm border border-neutral-border bg-neutral-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-border px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-100">Delete Sprint</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-[13px] text-slate-300">
            Are you sure you want to delete <span className="font-semibold text-slate-100">{sprintName}</span>?
            This will remove the sprint and unassign all tasks.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-sm border border-neutral-border px-4 text-[12px] font-medium text-slate-400 transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="h-8 rounded-sm bg-rose-600 px-4 text-[12px] font-medium text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete Sprint"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function SprintsLayout() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [backlogSearch, setBacklogSearch] = useState("");
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    sprints,
    selectedSprint,
    selectedSprintId,
    setSelectedSprintId,
    backlogTasks,
    todoTasks,
    inProgressTasks,
    doneTasks,
    sprintStats,
    progressPct,
    createSprint,
    updateSprint,
    startSprint,
    completeSprint,
    deleteSprint,
    moveTaskToSprint,
    updateTaskStatus,
    isCreatingSprint,
    isUpdatingSprint,
    isStartingSprint,
    isCompletingSprint,
    isDeletingSprint,
    isMovingTask,
    isUpdatingTaskStatus,
    isLoadingProjects,
    isLoadingSprints,
    isLoadingTasks,
    projectsError,
    sprintsError,
    tasksError,
    actionError,
  } = useSprintsData();

  const filteredBacklog = useMemo(() => {
    if (!backlogSearch.trim()) return backlogTasks;
    const query = backlogSearch.trim().toLowerCase();
    return backlogTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.identifier.toLowerCase().includes(query),
    );
  }, [backlogSearch, backlogTasks]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      const statusMap: Record<string, BoardTaskStatus> = {
        "column-todo": "To Do",
        "column-inprogress": "In Progress",
        "column-done": "Done",
      };

      const newStatus = statusMap[destination.droppableId];
      if (!newStatus) return;

      void updateTaskStatus(draggableId, newStatus);
    },
    [updateTaskStatus],
  );

  const surfaceError = projectsError ?? sprintsError ?? tasksError ?? actionError;

  if (isLoadingProjects && projects.length === 0) {
    return (
      <div className="flex-1">
        <EmptyState
          icon={Package}
          title="Loading sprint workspace"
          description="Fetching live projects, sprints, and backlog tasks."
        />
      </div>
    );
  }

  if (surfaceError && projects.length === 0) {
    return (
      <div className="flex-1">
        <EmptyState
          icon={Package}
          title="Sprints are unavailable"
          description={surfaceError instanceof Error ? surfaceError.message : "The live sprint queries failed."}
        />
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="flex-1">
        <EmptyState
          icon={Package}
          title="Create a project first"
          description="Sprints are project-scoped in the backend, so the live sprint planner needs at least one project before sprint planning can begin."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-neutral-border bg-neutral-surface/30 px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-100">Sprint Planning</h2>
            <p className="mt-1 text-[12px] text-slate-500">
              Live project-scoped sprint planning backed by persisted sprint and task contracts.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedProjectId ?? ""}
              onChange={(event) => setSelectedProjectId(event.target.value || null)}
              className="h-9 min-w-[240px] rounded-sm border border-neutral-border bg-slate-800/50 px-3 text-[13px] text-slate-200 outline-none transition-colors focus:border-primary"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-sm bg-primary px-4 text-[13px] font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Plus className="size-4" />
              New Sprint
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-neutral-border bg-background-dark/60 px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {sprints.map((sprint) => (
            <button
              key={sprint.id}
              type="button"
              onClick={() => setSelectedSprintId(sprint.id)}
              className={`shrink-0 rounded-sm border px-4 py-2 text-left transition-colors ${
                sprint.id === selectedSprintId
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-neutral-border bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">{sprint.name}</span>
                <SprintStatusBadge status={sprint.status} />
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {sprint.completedTaskCount}/{sprint.taskCount} tasks complete
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {!selectedSprint ? (
          <EmptyState
            icon={Package}
            title="No sprints in this project yet"
            description={
              selectedProject
                ? `Create the first sprint for ${selectedProject.name} to start planning live work.`
                : "Create a sprint to get started."
            }
            actionLabel="Create Sprint"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="space-y-6">
            <div className="rounded-sm border border-neutral-border bg-neutral-surface p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-[16px] font-semibold text-slate-100">{selectedSprint.name}</h3>
                    <SprintStatusBadge status={selectedSprint.status} />
                    <span className="text-[11px] font-mono text-slate-500">
                      {daysRemaining(selectedSprint.endDate)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[12px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {formatDateRange(selectedSprint.startDate, selectedSprint.endDate)}
                    </span>
                    {selectedSprint.goalDescription ? (
                      <span className="flex items-center gap-1.5">
                        <Target className="size-3.5" />
                        {selectedSprint.goalDescription}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-[12px] font-mono text-slate-400">{progressPct}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-neutral-border bg-white/[0.03] px-3 text-[12px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06]"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteDialog(true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-rose-500/20 bg-rose-500/10 px-3 text-[12px] font-medium text-rose-400 transition-colors hover:bg-rose-500/20"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                  {selectedSprint.status === "planning" ? (
                    <button
                      type="button"
                      onClick={() => void startSprint(selectedSprint.id)}
                      disabled={isStartingSprint}
                      className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-emerald-600 px-4 text-[12px] font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Flame className="size-3.5" />
                      {isStartingSprint ? "Starting..." : "Start Sprint"}
                    </button>
                  ) : null}
                  {selectedSprint.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => void completeSprint(selectedSprint.id)}
                      disabled={isCompletingSprint}
                      className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-slate-600 px-4 text-[12px] font-medium text-white transition-colors hover:bg-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="size-3.5" />
                      {isCompletingSprint ? "Completing..." : "Complete Sprint"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "Total Tasks", value: sprintStats.total, icon: ListTodo, color: "text-slate-400" },
                { label: "To Do", value: sprintStats.todo, icon: Circle, color: "text-blue-400" },
                { label: "In Progress", value: sprintStats.inProgress, icon: Clock, color: "text-amber-400" },
                { label: "Completed", value: sprintStats.completed, icon: CheckCircle2, color: "text-emerald-400" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 rounded-sm border border-neutral-border bg-neutral-surface p-4">
                  <stat.icon className={`size-5 ${stat.color}`} />
                  <div>
                    <p className="text-[20px] font-semibold leading-none text-slate-100">{stat.value}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {surfaceError ? (
              <div className="rounded-sm border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[12px] text-amber-200">
                {surfaceError instanceof Error ? surfaceError.message : "A sprint action failed."}
              </div>
            ) : null}

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <SprintColumn
                  title="To Do"
                  icon={Circle}
                  tasks={todoTasks}
                  droppableId="column-todo"
                  actionLabel="Remove"
                  onTaskAction={(taskId) => void moveTaskToSprint(taskId, null)}
                  onTaskAdvance={(taskId) => void updateTaskStatus(taskId, "In Progress")}
                />
                <SprintColumn
                  title="In Progress"
                  icon={Clock}
                  tasks={inProgressTasks}
                  droppableId="column-inprogress"
                  actionLabel="Remove"
                  onTaskAction={(taskId) => void moveTaskToSprint(taskId, null)}
                  onTaskAdvance={(taskId) => void updateTaskStatus(taskId, "Done")}
                />
                <SprintColumn
                  title="Done"
                  icon={CheckCircle2}
                  tasks={doneTasks}
                  droppableId="column-done"
                  actionLabel="Remove"
                  onTaskAction={(taskId) => void moveTaskToSprint(taskId, null)}
                />
              </div>
            </DragDropContext>

            <div className="rounded-sm border border-neutral-border bg-neutral-surface">
              <div className="flex flex-col gap-3 border-b border-neutral-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="size-4 text-slate-400" />
                  <h3 className="text-[13px] font-semibold text-slate-200">Project Backlog</h3>
                  <span className="rounded-sm bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                    {filteredBacklog.length}
                  </span>
                </div>
                <input
                  value={backlogSearch}
                  onChange={(event) => setBacklogSearch(event.target.value)}
                  placeholder="Search backlog..."
                  className="h-8 w-full rounded-sm border border-neutral-border bg-slate-800/50 px-3 text-[12px] text-slate-200 outline-none transition-colors focus:border-primary sm:max-w-xs"
                />
              </div>
              <div className="space-y-2 p-5">
                {isLoadingSprints || isLoadingTasks ? (
                  <div className="py-6 text-center text-[12px] text-slate-500">
                    Loading live backlog...
                  </div>
                ) : filteredBacklog.length === 0 ? (
                  <div className="py-6 text-center text-[12px] text-slate-500">
                    {backlogSearch ? "No backlog tasks match your search." : "No unassigned backlog tasks remain for this project."}
                  </div>
                ) : (
                  filteredBacklog.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      actionLabel="Add to Sprint"
                      onAction={() => void moveTaskToSprint(task.id, selectedSprint.id)}
                      onAdvance={
                        task.status !== "Done"
                          ? () => void updateTaskStatus(task.id, "In Progress")
                          : undefined
                      }
                    />
                  ))
                )}
              </div>
              {(isMovingTask || isUpdatingTaskStatus) ? (
                <div className="border-t border-neutral-border px-5 py-3 text-[11px] text-slate-500">
                  Syncing sprint assignments...
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal ? (
          <CreateSprintModal
            isSubmitting={isCreatingSprint}
            onClose={() => setShowCreateModal(false)}
            onCreate={async (input) => {
              await createSprint(input);
            }}
          />
        ) : null}
        {showEditModal && selectedSprint ? (
          <EditSprintModal
            sprint={selectedSprint}
            isSubmitting={isUpdatingSprint}
            onClose={() => setShowEditModal(false)}
            onSave={async (input) => {
              await updateSprint(selectedSprint.id, input);
            }}
          />
        ) : null}
        {showDeleteDialog && selectedSprint ? (
          <DeleteSprintDialog
            sprintName={selectedSprint.name}
            isDeleting={isDeletingSprint}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={() => {
              void deleteSprint(selectedSprint.id).then(() => {
                setShowDeleteDialog(false);
              });
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
