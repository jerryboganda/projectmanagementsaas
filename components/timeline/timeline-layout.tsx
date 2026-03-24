"use client";

import { useMemo, useState, useCallback } from "react";
import { TimelineToolbar } from "./timeline-toolbar";
import { TimelineSurface } from "./timeline-surface";
import { TimelineDetail } from "./timeline-detail";
import { TimelineCreateModal } from "./timeline-create-modal";
import { AnimatePresence } from "motion/react";
import { Loader2, AlertTriangle, RefreshCcw, GanttChart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { timelineStatusLabel, type TimelineItem } from "./data";
import { useTimelineData } from "@/hooks/use-timeline-data";
import type { TimelineUpdateInput, TimelineCreateTaskInput } from "@/hooks/use-timeline-data";

export function TimelineLayout() {
  const {
    activeWorkspaceId,
    timelineItems,
    assigneeOptions,
    statusOptions,
    warning,
    error,
    isLoading,
    isFetching,
    refreshTimeline,
    hasLiveData,
    liveCounts,
    projects,
    updateTimelineItem,
    createTimelineTask,
    isSavingTimelineItem,
    isCreatingTimelineTask,
  } = useTimelineData();

  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [zoomLevel, setZoomLevel] = useState<"days" | "weeks" | "months">("days");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleRetry = () => {
    void refreshTimeline();
  };

  const filteredItems = useMemo(() => {
    return timelineItems.filter((item) => {
      const matchesSearch = [
        item.title,
        item.description ?? "",
        item.projectName,
        item.projectIdentifier,
        item.sprintName ?? "",
        item.sprintGoal ?? "",
        item.notes ?? "",
        timelineStatusLabel(item.status),
        item.assignee?.name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesAssignee =
        assigneeFilter === "All" ||
        (assigneeFilter === "__unassigned__"
          ? !item.assignee
          : item.assignee?.id === assigneeFilter);
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesAssignee && matchesStatus;
    });
  }, [timelineItems, searchQuery, assigneeFilter, statusFilter]);

  const selectedItem = useMemo(() => {
    return timelineItems.find((item) => item.id === selectedItemId) || null;
  }, [timelineItems, selectedItemId]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const handleItemUpdate = useCallback(
    async (item: TimelineItem, newStartDate: string, newEndDate: string) => {
      setSavingItemId(item.id);
      try {
        await updateTimelineItem(item, { startDate: newStartDate, endDate: newEndDate });
      } finally {
        setSavingItemId(null);
      }
    },
    [updateTimelineItem],
  );

  const handleDetailSave = useCallback(
    async (item: TimelineItem, updates: TimelineUpdateInput) => {
      setSavingItemId(item.id);
      try {
        await updateTimelineItem(item, updates);
      } finally {
        setSavingItemId(null);
      }
    },
    [updateTimelineItem],
  );

  const handleCreateTask = useCallback(
    async (input: TimelineCreateTaskInput) => {
      await createTimelineTask(input);
    },
    [createTimelineTask],
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark relative">
      <TimelineToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        zoomLevel={zoomLevel}
        onZoomLevelChange={setZoomLevel}
        itemCount={filteredItems.length}
        assigneeOptions={assigneeOptions}
        statusOptions={statusOptions}
        onRefresh={handleRetry}
        isRefreshing={isFetching}
        onNewTask={() => setIsCreateModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {isLoading ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background-dark">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="size-8 text-primary animate-spin" />
              <div className="text-[13px] text-slate-400 font-medium">
                Loading timeline data...
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background-dark">
            <div className="flex flex-col items-center gap-4 max-w-sm text-center">
              <div className="size-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2">
                <AlertTriangle className="size-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-200">
                Something went wrong
              </h3>
              <p className="text-[13px] text-slate-400 mb-4">
                {error instanceof Error
                  ? error.message
                  : "Failed to load timeline data."}
              </p>
              <button
                onClick={handleRetry}
                className="h-9 px-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-sm text-[13px] font-medium text-slate-200 transition-colors flex items-center gap-2"
              >
                <RefreshCcw className="size-4" />
                Try Again
              </button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex-1">
            <EmptyState
              icon={GanttChart}
              title={
                searchQuery || assigneeFilter !== "All" || statusFilter !== "All"
                  ? "No timeline items match your filters"
                  : activeWorkspaceId
                    ? "No live timeline items yet"
                    : "Select a workspace to view the timeline"
              }
              description={
                searchQuery || assigneeFilter !== "All" || statusFilter !== "All"
                  ? "Try adjusting your search or filter criteria."
                  : activeWorkspaceId
                    ? "Timeline items are derived from live projects, sprints, and tasks with date ranges."
                    : "Choose a workspace and the timeline will populate from live backend data."
              }
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {warning && (
              <div className="mx-4 mt-4 rounded-sm border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
                {warning.message}
              </div>
            )}
            {hasLiveData && (
              <div className="px-4 pt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Live data: {liveCounts.projects} projects, {liveCounts.sprints}{" "}
                sprints, {liveCounts.tasks} tasks
              </div>
            )}
            <TimelineSurface
              items={filteredItems}
              zoomLevel={zoomLevel}
              selectedItemId={selectedItemId}
              onItemSelect={setSelectedItemId}
              onItemUpdate={handleItemUpdate}
              savingItemId={savingItemId}
            />
          </div>
        )}

        <AnimatePresence>
          {selectedItem && (
            <div className="absolute top-0 right-0 bottom-0 z-20">
              <TimelineDetail
                key={[
                  selectedItem.id,
                  selectedItem.title,
                  selectedItem.description ?? "",
                  selectedItem.status,
                  selectedItem.priority,
                  selectedItem.startDate,
                  selectedItem.endDate,
                ].join(":")}
                item={selectedItem}
                onClose={() => setSelectedItemId(null)}
                onSave={handleDetailSave}
                isSaving={savingItemId === selectedItem.id}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Task Modal */}
      <TimelineCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        isSubmitting={isCreatingTimelineTask}
        projects={projects}
      />
    </div>
  );
}
