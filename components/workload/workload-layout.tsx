"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Loader2, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkloadData } from "@/hooks/use-workload-data";
import { WorkloadSummary } from "./workload-summary";
import { WorkloadToolbar } from "./workload-toolbar";
import { WorkloadSurface } from "./workload-surface";
import { WorkloadDetail } from "./workload-detail";

export function WorkloadLayout() {
  const {
    projectOptions,
    selectedProjectId,
    setSelectedProjectId,
    searchQuery,
    setSearchQuery,
    members,
    summary,
    selectedMemberId,
    setSelectedMemberId,
    selectedMember,
    selectedMemberTasks,
    tasks,
    isLoading,
    isRefreshing,
    error,
    refresh,
    hasData,
    hasFilteredResults,
    exportCsv,
    workloadLevelFilter,
    setWorkloadLevelFilter,
  } = useWorkloadData();

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-background-dark">
      <WorkloadToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        projectOptions={projectOptions}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
        onExportCsv={hasData ? exportCsv : null}
        workloadLevelFilter={workloadLevelFilter}
        onWorkloadLevelFilterChange={setWorkloadLevelFilter}
      />

      <WorkloadSummary summary={summary} />

      <div className="relative flex flex-1 overflow-hidden">
        {isLoading ? (
          <motion.div
            key="workload-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-background-dark/70 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-slate-400">
                Loading live workload data...
              </p>
            </div>
          </motion.div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={AlertTriangle}
              title="Workload data is unavailable"
              description={
                error instanceof Error
                  ? error.message
                  : "The live analytics query failed for this workspace."
              }
              actionLabel="Retry"
              onAction={refresh}
            />
          </div>
        ) : !hasData ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={Users}
              title="No live workload yet"
              description="This workspace has not accumulated enough tasks and time entries to build the workload dashboard."
            />
          </div>
        ) : !hasFilteredResults ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={Users}
              title="No team members match the current filters"
              description="Try clearing the search box, switching projects, or adjusting the workload level filter."
              actionLabel="Clear filters"
              onAction={() => {
                setSearchQuery("");
                setWorkloadLevelFilter("all");
              }}
            />
          </div>
        ) : (
          <WorkloadSurface
            members={members}
            selectedMemberId={selectedMemberId}
            onMemberSelect={setSelectedMemberId}
            tasks={tasks}
          />
        )}

        <AnimatePresence>
          {selectedMember ? (
            <WorkloadDetail
              member={selectedMember}
              tasks={selectedMemberTasks}
              onClose={() => setSelectedMemberId(null)}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
