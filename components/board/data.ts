import type { BoardTask, BoardTaskStatus } from "@/components/board/types";

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface BoardData {
  tasks: Record<string, BoardTask>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

const STATUS_COLUMNS: BoardTaskStatus[] = ["To Do", "In Progress", "In Review", "Done"];

/**
 * Build a BoardData structure from an array of tasks.
 * Columns correspond to the four canonical statuses.
 */
export function buildBoardData(tasks: BoardTask[]): BoardData {
  const taskMap: Record<string, BoardTask> = {};
  const columns: Record<string, Column> = {};

  for (const status of STATUS_COLUMNS) {
    columns[status] = { id: status, title: status, taskIds: [] };
  }

  for (const task of tasks) {
    taskMap[task.id] = task;
    if (columns[task.status]) {
      columns[task.status].taskIds.push(task.id);
    }
  }

  return {
    tasks: taskMap,
    columns,
    columnOrder: [...STATUS_COLUMNS],
  };
}
