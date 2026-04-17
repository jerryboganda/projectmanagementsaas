import { Search, Filter, Plus, ChevronDown, ListFilter, LayoutGrid, List, Settings, Zap, Users } from "lucide-react";

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (a: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (p: string) => void;
  groupBy: string;
  onGroupByChange: (g: string) => void;
  taskCount: number;
  onNewTask?: () => void;
}

export function BoardToolbar({
  searchQuery,
  onSearchChange,
  assigneeFilter,
  onAssigneeFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  groupBy,
  onGroupByChange,
  taskCount,
  onNewTask
}: Props) {
  const hasFilters = searchQuery !== "" || assigneeFilter !== "All" || priorityFilter !== "All" || groupBy !== "None";

  const handleClearFilters = () => {
    onSearchChange("");
    onAssigneeFilterChange("All");
    onPriorityFilterChange("All");
    onGroupByChange("None");
  };

  return (
    <div className="h-14 border-b border-neutral-border bg-neutral-surface/50 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative group w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/[0.02] border border-neutral-border pl-9 pr-3 py-1.5 text-[13px] text-slate-200 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] placeholder:text-slate-600 rounded-sm transition-colors"
          />
        </div>

        <div className="h-4 w-px bg-neutral-border" />

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
            <select 
              value={assigneeFilter}
              onChange={(e) => onAssigneeFilterChange(e.target.value)}
              aria-label="Filter by assignee"
              className="appearance-none bg-white/[0.02] border border-neutral-border pl-8 pr-8 py-1.5 text-[13px] text-slate-300 focus:outline-none focus:border-primary/50 rounded-sm transition-colors cursor-pointer"
            >
              <option value="All" className="bg-background-dark">All Assignees</option>
              <option value="Me" className="bg-background-dark">Assigned to me</option>
              <option value="Unassigned" className="bg-background-dark">Unassigned</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <Zap className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
            <select 
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              aria-label="Filter by priority"
              className="appearance-none bg-white/[0.02] border border-neutral-border pl-8 pr-8 py-1.5 text-[13px] text-slate-300 focus:outline-none focus:border-primary/50 rounded-sm transition-colors cursor-pointer"
            >
              <option value="All" className="bg-background-dark">All Priorities</option>
              <option value="Urgent" className="bg-background-dark">Urgent</option>
              <option value="High" className="bg-background-dark">High</option>
              <option value="Medium" className="bg-background-dark">Medium</option>
              <option value="Low" className="bg-background-dark">Low</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="h-4 w-px bg-neutral-border mx-1" />
          
          <div className="relative flex items-center gap-2">
            <ListFilter className="size-3.5 text-slate-500" />
            <select 
              value={groupBy}
              onChange={(e) => onGroupByChange(e.target.value)}
              aria-label="Group tasks by"
              className="appearance-none bg-transparent border-none pl-1 pr-6 py-1.5 text-[13px] text-slate-300 focus:outline-none focus:text-slate-200 rounded-sm transition-colors cursor-pointer font-medium"
            >
              <option value="None" className="bg-background-dark">No Grouping</option>
              <option value="Assignee" className="bg-background-dark">Group by Assignee</option>
              <option value="Priority" className="bg-background-dark">Group by Priority</option>
              <option value="Project" className="bg-background-dark">Group by Project</option>
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
          </div>

          {hasFilters && (
            <button 
              type="button"
              onClick={handleClearFilters}
              aria-label="Clear all filters"
              className="text-[12px] text-slate-400 hover:text-slate-200 px-2 transition-colors ml-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" aria-label="Board settings" className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] rounded-sm transition-colors">
          <Settings className="size-4" aria-hidden="true" />
        </button>

        <div className="h-4 w-px bg-neutral-border mx-1" />

        <span className="text-[12px] text-slate-500 font-mono">
          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
        </span>
        <button
          type="button"
          onClick={onNewTask}
          aria-label="Create new task"
          className="h-8 px-3 border border-primary bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5 rounded-sm transition-colors"
        >
          <Plus className="size-[16px]" aria-hidden="true" />
          <span className="text-[12px] font-medium">New Task</span>
        </button>
      </div>
    </div>
  );
}
