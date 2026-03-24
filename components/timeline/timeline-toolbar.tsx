"use client";

import { Search, Users, ChevronDown, ListFilter, RefreshCcw, Plus } from "lucide-react";
import type { TimelineAssigneeOption, TimelineFilterOption } from "./data";

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (a: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  zoomLevel: "days" | "weeks" | "months";
  onZoomLevelChange: (z: "days" | "weeks" | "months") => void;
  itemCount: number;
  assigneeOptions: TimelineAssigneeOption[];
  statusOptions: TimelineFilterOption[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onNewTask?: () => void;
}

export function TimelineToolbar({
  searchQuery,
  onSearchChange,
  assigneeFilter,
  onAssigneeFilterChange,
  statusFilter,
  onStatusFilterChange,
  zoomLevel,
  onZoomLevelChange,
  itemCount,
  assigneeOptions,
  statusOptions,
  onRefresh,
  isRefreshing,
  onNewTask,
}: Props) {
  const hasFilters = searchQuery !== "" || assigneeFilter !== "All" || statusFilter !== "All";

  const handleClearFilters = () => {
    onSearchChange("");
    onAssigneeFilterChange("All");
    onStatusFilterChange("All");
  };

  return (
    <div className="h-14 border-b border-neutral-border bg-neutral-surface/50 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative group w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search timeline..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/[0.02] border border-neutral-border pl-9 pr-3 py-1.5 text-[13px] text-slate-200 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] placeholder:text-slate-600 rounded-sm transition-colors"
          />
        </div>

        <div className="h-4 w-px bg-neutral-border"></div>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
            <select 
              value={assigneeFilter}
              onChange={(e) => onAssigneeFilterChange(e.target.value)}
              className="appearance-none bg-white/[0.02] border border-neutral-border pl-8 pr-8 py-1.5 text-[13px] text-slate-300 focus:outline-none focus:border-primary/50 rounded-sm transition-colors cursor-pointer"
            >
              <option value="All" className="bg-background-dark">All Assignees</option>
              <option value="__unassigned__" className="bg-background-dark">Unassigned</option>
              {assigneeOptions.map((option) => (
                <option key={option.id} value={option.id} className="bg-background-dark">
                  {option.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <ListFilter className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
            <select 
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="appearance-none bg-white/[0.02] border border-neutral-border pl-8 pr-8 py-1.5 text-[13px] text-slate-300 focus:outline-none focus:border-primary/50 rounded-sm transition-colors cursor-pointer"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-background-dark">
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
          </div>

          {hasFilters && (
            <button 
              onClick={handleClearFilters}
              className="text-[12px] text-slate-400 hover:text-slate-200 px-2 transition-colors ml-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onNewTask && (
          <button
            onClick={onNewTask}
            className="h-8 px-3 border border-primary bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5 rounded-sm transition-colors"
          >
            <Plus className="size-[14px]" />
            <span className="text-[12px] font-medium">New Task</span>
          </button>
        )}

        <div className="flex items-center bg-white/[0.02] border border-neutral-border rounded-sm p-0.5">
          <button 
            onClick={() => onZoomLevelChange("days")}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-sm transition-colors ${zoomLevel === "days" ? "bg-white/[0.08] text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
          >
            Days
          </button>
          <button 
            onClick={() => onZoomLevelChange("weeks")}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-sm transition-colors ${zoomLevel === "weeks" ? "bg-white/[0.08] text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
          >
            Weeks
          </button>
          <button 
            onClick={() => onZoomLevelChange("months")}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-sm transition-colors ${zoomLevel === "months" ? "bg-white/[0.08] text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
          >
            Months
          </button>
        </div>

        <div className="h-4 w-px bg-neutral-border mx-1"></div>

        <span className="text-[12px] text-slate-500 font-mono">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 px-3 border border-primary bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white flex items-center gap-1.5 rounded-sm transition-colors"
        >
          <RefreshCcw className={`size-[16px] ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="text-[12px] font-medium">Refresh</span>
        </button>
      </div>
    </div>
  );
}
