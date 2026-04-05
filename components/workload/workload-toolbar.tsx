"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { RefreshCcw, Search, Briefcase, SlidersHorizontal, Download, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkloadProjectOption, WorkloadTone } from "./data";
import { getWorkloadToneLabel, getWorkloadToneClasses } from "./data";

type WorkloadLevelFilter = WorkloadTone | "all";

const WORKLOAD_LEVEL_OPTIONS: { value: WorkloadLevelFilter; label: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "idle", label: "Idle" },
  { value: "balanced", label: "Balanced" },
  { value: "watch", label: "Watch" },
  { value: "busy", label: "Busy" },
];

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  projectOptions: WorkloadProjectOption[];
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  onExportCsv: (() => void) | null;
  workloadLevelFilter: WorkloadLevelFilter;
  onWorkloadLevelFilterChange: (level: WorkloadLevelFilter) => void;
}

export type { WorkloadLevelFilter };

export function WorkloadToolbar({
  searchQuery,
  onSearchChange,
  projectOptions,
  selectedProjectId,
  onProjectChange,
  onRefresh,
  isRefreshing,
  onExportCsv,
  workloadLevelFilter,
  onWorkloadLevelFilterChange,
}: Props) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const hasActiveFilters = searchQuery.trim().length > 0 || !!selectedProjectId || workloadLevelFilter !== "all";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedProjectLabel = useMemo(() => {
    if (!selectedProjectId) {
      return "All projects";
    }

    return projectOptions.find((project) => project.id === selectedProjectId)?.label ?? "Selected project";
  }, [projectOptions, selectedProjectId]);

  const clearFilters = () => {
    onSearchChange("");
    onProjectChange(null);
    onWorkloadLevelFilterChange("all");
  };

  return (
    <div className="flex flex-col gap-3 border-b border-neutral-border bg-neutral-surface/50 px-4 py-3 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search members, projects, or tasks"
            className="h-10 w-full rounded-lg border border-neutral-border bg-white/[0.02] pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-primary/40 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Briefcase className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <select
              value={selectedProjectId ?? ""}
              onChange={(event) => onProjectChange(event.target.value || null)}
              className="h-10 appearance-none rounded-lg border border-neutral-border bg-white/[0.02] pl-10 pr-10 text-sm text-slate-100 focus:border-primary/40 focus:outline-none"
            >
              <option value="">All projects</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.identifier} - {project.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-neutral-border bg-white/[0.02] px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.05]"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-300">
          Live workspace data
        </span>
        <span className="hidden rounded-full border border-neutral-border bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500 md:inline-flex">
          {selectedProjectLabel}
        </span>

        {/* CSV Export Button */}
        <button
          type="button"
          onClick={() => onExportCsv?.()}
          disabled={!onExportCsv}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-neutral-border bg-white/[0.02] px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.05]",
            !onExportCsv && "pointer-events-none opacity-50",
          )}
          title="Export as CSV"
        >
          <Download className="size-4" />
          Export
        </button>

        <button
          type="button"
          onClick={() => void onRefresh()}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-neutral-border bg-white/[0.02] px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.05]",
            isRefreshing && "pointer-events-none opacity-70",
          )}
        >
          <RefreshCcw className={cn("size-4", isRefreshing && "animate-spin")} />
          Refresh
        </button>

        {/* Advanced Workload Level Filter */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={cn(
              "rounded-lg border p-2 transition-colors",
              isFilterOpen || workloadLevelFilter !== "all"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-neutral-border bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
            )}
            aria-label="Workload level filters"
          >
            <SlidersHorizontal className="size-4" />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-neutral-border bg-neutral-surface shadow-xl z-50">
              <div className="px-3 py-2 border-b border-neutral-border/50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workload Level</span>
              </div>
              <div className="py-1">
                {WORKLOAD_LEVEL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onWorkloadLevelFilterChange(option.value);
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 text-sm transition-colors",
                      workloadLevelFilter === option.value
                        ? "bg-primary/10 text-primary"
                        : "text-slate-300 hover:bg-white/5 hover:text-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{option.label}</span>
                      {option.value !== "all" && (
                        <span className={cn(
                          "rounded-sm px-1.5 py-0.5 text-[10px] font-medium border",
                          getWorkloadToneClasses(option.value)
                        )}>
                          {getWorkloadToneLabel(option.value)}
                        </span>
                      )}
                    </div>
                    {workloadLevelFilter === option.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
