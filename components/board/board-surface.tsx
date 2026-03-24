import { DragDropContext, DropResult, Droppable, Draggable } from "@hello-pangea/dnd";
import { BoardData } from "./data";
import { BoardColumn } from "./board-column";
import { useState, useEffect } from "react";
import type { BoardTaskStatus, BoardUser } from "@/components/board/types";

interface Props {
  data: BoardData;
  membersById: Map<string, BoardUser>;
  onDragEnd: (result: DropResult) => void;
  selectedTaskId: string | null;
  onTaskSelect: (id: string) => void;
  onCreateTask: (status: BoardTaskStatus) => void;
  isDragDisabled?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleSelect?: (taskId: string) => void;
}

export function BoardSurface({ data, membersById, onDragEnd, selectedTaskId, onTaskSelect, onCreateTask, isDragDisabled = false, selectedTaskIds, onToggleSelect }: Props) {
  // Ensure we only render the drag drop context on the client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="all-columns" direction="horizontal" type="column" isDropDisabled={isDragDisabled}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex gap-4 p-6 h-full overflow-x-auto overflow-y-hidden items-start"
          >
            {data.columnOrder.length === 0 && (
              <div className="flex flex-col items-center justify-center w-full h-full text-slate-500 gap-2">
                <p className="text-sm">No tasks found for the current filters.</p>
              </div>
            )}
            
            {data.columnOrder.map((columnId, index) => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map((taskId) => data.tasks[taskId]).filter(Boolean);

              return (
                <Draggable key={column.id} draggableId={column.id} index={index} isDragDisabled={isDragDisabled}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`h-full flex flex-col shrink-0 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                    >
                      <BoardColumn
                        column={column}
                        tasks={tasks}
                        membersById={membersById}
                        selectedTaskId={selectedTaskId}
                        onTaskSelect={onTaskSelect}
                        onCreateTask={onCreateTask}
                        dragHandleProps={provided.dragHandleProps}
                        isDragDisabled={isDragDisabled}
                        selectedTaskIds={selectedTaskIds}
                        onToggleSelect={onToggleSelect}
                      />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
            
            {/* Add Column Button */}
            {!isDragDisabled && (
              <button onClick={() => onCreateTask("To Do")} className="flex items-center justify-center w-[320px] shrink-0 h-12 bg-white/[0.02] border border-dashed border-neutral-border hover:border-primary/50 hover:bg-white/[0.05] rounded-lg text-slate-400 hover:text-slate-200 transition-colors gap-2">
                <span className="text-[13px] font-medium">Create Task</span>
              </button>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
