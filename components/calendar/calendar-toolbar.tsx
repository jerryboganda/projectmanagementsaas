"use client";

import { Search, Plus, ChevronLeft, ChevronRight, X } from "lucide-react";
import { ViewMode } from "./calendar-layout";

interface Props {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  itemCount: number;
  onNewEvent?: () => void;
}

export function CalendarToolbar({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  itemCount,
  onNewEvent
}: Props) {
  const hasSearch = searchQuery.trim() !== "";

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    }
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const getFormatOptions = (): Intl.DateTimeFormatOptions => {
    if (viewMode === "month") return { month: "long", year: "numeric" };
    if (viewMode === "day" || viewMode === "agenda") return { month: "long", day: "numeric", year: "numeric" };
    
    // Week view logic
    const endOfWeek = new Date(currentDate);
    endOfWeek.setDate(currentDate.getDate() + 6);
    
    if (currentDate.getMonth() !== endOfWeek.getMonth()) {
      return { month: "short", year: "numeric" }; // e.g., "Sep - Oct 2026" handled manually below
    }
    return { month: "long", year: "numeric" };
  };

  const getFormattedDate = () => {
    if (viewMode === "week") {
      const start = new Date(currentDate);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      start.setDate(diff);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      if (start.getMonth() !== end.getMonth()) {
        return `${start.toLocaleDateString("en-US", { month: "short" })} - ${end.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
      }
      return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    return currentDate.toLocaleDateString("en-US", getFormatOptions());
  };

  return (
    <div className="h-14 border-b border-neutral-border bg-neutral-surface/50 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={goToToday}
            aria-label="Jump to today"
            className="px-3 py-1.5 text-[13px] font-medium text-slate-300 hover:text-slate-100 bg-white/[0.02] hover:bg-white/[0.05] border border-neutral-border rounded-sm transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-white/[0.02] border border-neutral-border rounded-sm" role="group" aria-label="Navigate dates">
            <button 
              type="button"
              onClick={() => navigateDate("prev")}
              aria-label="Previous period"
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors border-r border-neutral-border"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button 
              type="button"
              onClick={() => navigateDate("next")}
              aria-label="Next period"
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <h2 className="text-[15px] font-medium text-slate-200 ml-2 min-w-[140px]">
            {getFormattedDate()}
          </h2>
        </div>

        <div className="h-4 w-px bg-neutral-border mx-2" />

        <div className="flex items-center gap-2">
          <div className="relative group w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white/[0.02] border border-neutral-border pl-8 pr-3 py-1.5 text-[13px] text-slate-200 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] placeholder:text-slate-600 rounded-sm transition-colors"
            />
          </div>

          {hasSearch && (
            <button 
              onClick={() => onSearchChange("")}
              className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-slate-200 border border-neutral-border bg-white/[0.02] rounded-sm transition-colors"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-white/[0.02] border border-neutral-border rounded-sm p-0.5" role="radiogroup" aria-label="Calendar view mode">
          {(["month", "week", "day", "agenda"] as ViewMode[]).map((mode) => (
            <button 
              key={mode}
              type="button"
              role="radio"
              aria-checked={viewMode === mode}
              aria-label={`${mode} view`}
              onClick={() => onViewModeChange(mode)}
              className={`px-2.5 py-1 text-[12px] font-medium rounded-sm transition-colors capitalize ${viewMode === mode ? "bg-white/[0.08] text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-neutral-border mx-1" />

        <span className="text-[12px] text-slate-500 font-mono">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
        <button type="button" onClick={onNewEvent} aria-label="Create new event" className="h-8 px-3 border border-primary bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5 rounded-sm transition-colors">
          <Plus className="size-[16px]" aria-hidden="true" />
          <span className="text-[12px] font-medium">New Event</span>
        </button>
      </div>
    </div>
  );
}
