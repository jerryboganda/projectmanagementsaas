"use client";

import type { BoardTask, BoardTaskStatus, BoardUser } from "@/components/board/types";
import { Column } from "./data";
import { TaskCard } from "./task-card";
import { Droppable, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { Plus, MoreHorizontal } from "lucide-react";

interface Props {
  column: Column;
  tasks: BoardTask[];
  membersById: Map<string, BoardUser>;
  selectedTaskId: string | null;
  onTaskSelect: (id: string) => void;
  onCreateTask: (status: BoardTaskStatus) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDragDisabled?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleSelect?: (taskId: string) => void;
}

const COLUMN_ID_TO_STATUS: Record<string, BoardTaskStatus> = {
  "To Do": "To Do",
  "In Progress": "In Progress",
  "In Review": "In Review",
  "Done": "Done",
  "todo": "To Do",
  "in-progress": "In Progress",
  "in-review": "In Review",
  "done": "Done",
};

export function BoardColumn({
  column,
  tasks,
  membersById,
  selectedTaskId,
  onTaskSelect,
  onCreateTask,
  dragHandleProps,
  isDragDisabled = false,
  selectedTaskIds,
  onToggleSelect,
}: Props) {

  return (
    <div className="flex flex-col w-[320px] shrink-0 bg-neutral-surface/30 border border-neutral-border rounded-lg overflow-hidden h-full">
      {/* Column Header */}
      <div
        className={`flex items-center justify-between p-3 border-b border-neutral-border bg-neutral-surface/50 ${isDragDisabled ? '' : 'cursor-grab active:cursor-grabbing'}`}
        {...(isDragDisabled ? {} : dragHandleProps)}
      >
        <span className="text-[11px] font-mono text-slate-500 bg-white/[0.05] px-1.5 py-0.5 rounded-sm border border-white/[0.05]">
          {tasks.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCreateTask(COLUMN_ID_TO_STATUS[column.id] || "To Do")}
            className="p-1 text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] rounded-sm transition-colors"
            aria-label={`Add task to ${column.title}`}
          >
            <Plus className="size-3.5" />
          </button>
          <button
            className="p-1 text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] rounded-sm transition-colors"
            aria-label={`Column options for ${column.title}`}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      </div>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 p-2 overflow-y-auto min-h-[150px] transition-colors duration-200
              ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}
            `}
          >
            <div className="flex flex-col gap-2">
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  assignee={task.assigneeId ? membersById.get(task.assigneeId) : undefined}
                  index={index}
                  isSelected={selectedTaskId === task.id}
                  onClick={() => onTaskSelect(task.id)}
                  isDragDisabled={isDragDisabled}
                  isBulkSelected={selectedTaskIds?.has(task.id) ?? false}
                  onToggleSelect={onToggleSelect}
                />
              ))}
              {provided.placeholder}
            </div>
            {/* Empty State */}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="h-full flex items-center justify-center text-slate-500 text-[12px] border-2 border-dashed border-neutral-border rounded-lg m-2 p-4 text-center">
                Drag tasks here or click + to create
              </div>
            )}
          </div>
        )}
      </Droppable>
      <button
        onClick={() => onCreateTask(COLUMN_ID_TO_STATUS[column.id] || "To Do")}
        className="flex items-center gap-1.5 p-2.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border-t border-neutral-border transition-colors"
      >
        <Plus className="size-3.5" />
        <span className="text-[12px] font-medium">Add task</span>
      </button>
    </div>
  );
}
