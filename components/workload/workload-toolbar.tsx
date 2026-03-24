"use client";

import { useMemo } from "react";
import { RefreshCcw, Search, Briefcase, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkloadProjectOption } from "./data";

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  projectOptions: WorkloadProjectOption[];
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function WorkloadToolbar({
  searchQuery,
  onSearchChange,
  projectOptions,
  selectedProjectId,
  onProjectChange,
  onRefresh,
  isRefreshing,
}: Props) {
  const hasActiveFilters = searchQuery.trim().length > 0 || !!selectedProjectId;

  const selectedProjectLabel = useMemo(() => {
    if (!selectedProjectId) {
      return "All projects";
    }

    return projectOptions.find((project) => project.id === selectedProjectId)?.label ?? "Selected project";
  }, [projectOptions, selectedProjectId]);

  const clearFilters = () => {
    onSearchChange("");
    onProjectChange(null);
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
        <button
          type="button"
          className="rounded-lg border border-neutral-border bg-white/[0.02] p-2 text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-slate-200"
          aria-label="Workload filters"
        >
          <SlidersHorizontal className="size-4" />
        </button>
      </div>
    </div>
  );
}
