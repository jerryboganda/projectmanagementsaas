"use client";

import { Calendar, ChevronDown, Plus, Search, Target, Users } from "lucide-react";

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  cycleFilter: string;
  onCycleFilterChange: (cycle: string) => void;
  cycleOptions: string[];
  onNewGoal: () => void;
}

export function GoalsToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  cycleFilter,
  onCycleFilterChange,
  cycleOptions,
  onNewGoal,
}: Props) {
  const hasFilters =
    searchQuery !== "" || statusFilter !== "All" || typeFilter !== "All" || cycleFilter !== "All";

  const handleClearFilters = () => {
    onSearchChange("");
    onStatusFilterChange("All");
    onTypeFilterChange("All");
    onCycleFilterChange("All");
  };

  return (
    <div className="h-14 border-b border-neutral-border bg-neutral-surface/50 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative group w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search goals, owners, initiatives..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full bg-white/[0.02] border border-neutral-border pl-8 pr-3 py-1.5 text-[13px] text-slate-200 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] placeholder:text-slate-600 rounded-sm transition-colors"
          />
        </div>

        <div className="h-4 w-px bg-neutral-border mx-2" />

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Target className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
              className="appearance-none bg-white/[0.02] border border-neutral-border pl-8 pr-8 py-1.5 text-[13px] text-slate-300 focus:outline-none focus:border-primary/50 rounded-sm transition-colors cursor-pointer"
            >
              <option value="All" className="bg-background-dark">
                All Statuses
              </option>
              <option value="OnTrack" className="bg-background-dark">
                On Track
              </option>
              <option value="AtRisk" className="bg-background-dark">
                At Risk
              </option>
              <option value="OffTrack" className="bg-background-dark">
                Off Track
              </option>
              <option value="Completed" className="bg-background-dark">
                Completed
              </option>
              <option value="Cancelled" className="bg-background-dark">
                Cancelled
              </option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(event) => onTypeFilterChange(event.target.value)}
              className="appearance-none bg-white/[0.02] border border-neutral-border pl-8 pr-8 py-1.5 text-[13px] text-slate-300 focus:outline-none focus:border-primary/50 rounded-sm transition-colors cursor-pointer"
            >
              <option value="All" className="bg-background-dark">
                All Types
              </option>
              <option value="Objective" className="bg-background-dark">
                Objectives
              </option>
              <option value="KeyResult" className="bg-background-dark">
                Key Results
              </option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
            <select
              value={cycleFilter}
              onChange={(event) => onCycleFilterChange(event.target.value)}
              className="appearance-none bg-white/[0.02] border border-neutral-border pl-8 pr-8 py-1.5 text-[13px] text-slate-300 focus:outline-none focus:border-primary/50 rounded-sm transition-colors cursor-pointer"
            >
              <option value="All" className="bg-background-dark">
                All Cycles
              </option>
              {cycleOptions.map((cycle) => (
                <option key={cycle} value={cycle} className="bg-background-dark">
                  {cycle}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
          </div>

          {hasFilters ? (
            <button
              onClick={handleClearFilters}
              className="text-[12px] text-slate-400 hover:text-slate-200 px-2 transition-colors ml-1"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onNewGoal}
          className="h-8 px-3 bg-primary hover:bg-primary-hover text-white text-[13px] font-medium rounded-sm transition-colors flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          Create Goal
        </button>
      </div>
    </div>
  );
}
