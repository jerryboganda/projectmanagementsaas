"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { AlertTriangle, Loader2, RefreshCcw, Target } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateGoalModal } from "@/components/goals/create-goal-modal";
import { GoalsDetail } from "@/components/goals/goals-detail";
import type { GoalSurfaceItem } from "@/components/goals/data";
import { GoalsSummary } from "@/components/goals/goals-summary";
import { GoalsSurface } from "@/components/goals/goals-surface";
import { GoalsToolbar } from "@/components/goals/goals-toolbar";
import { useGoalsData } from "@/hooks/use-goals-data";

function formatCycle(targetDate?: string | null) {
  if (!targetDate) {
    return "No target";
  }

  const date = new Date(targetDate);
  if (Number.isNaN(date.getTime())) {
    return "No target";
  }

  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

function flattenGoalTree<T extends { subGoals: T[] }>(items: T[]): T[] {
  const result: T[] = [];
  for (const item of items) {
    result.push(item);
    if (item.subGoals.length > 0) {
      result.push(...flattenGoalTree(item.subGoals));
    }
  }
  return result;
}

export function GoalsLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [cycleFilter, setCycleFilter] = useState("All");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createParentGoalId, setCreateParentGoalId] = useState<string | null>(null);

  const goalsData = useGoalsData(selectedGoalId);

  const filteredGoals = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const matchesFilters = (goal: GoalSurfaceItem) => {
      const cycle = formatCycle(goal.targetDate);
      const initiativeMatch = goal.initiatives.some((initiative) =>
        initiative.title.toLowerCase().includes(normalizedSearch),
      );
      const ownerMatch = goal.owner?.fullName.toLowerCase().includes(normalizedSearch) ?? false;
      const titleMatch = goal.title.toLowerCase().includes(normalizedSearch);

      return (
        (normalizedSearch === "" || titleMatch || ownerMatch || initiativeMatch) &&
        (statusFilter === "All" || goal.status === statusFilter) &&
        (typeFilter === "All" || goal.type === typeFilter) &&
        (cycleFilter === "All" || cycle === cycleFilter)
      );
    };

    const filterTree = (items: GoalSurfaceItem[]): GoalSurfaceItem[] =>
      items.flatMap((goal) => {
        const filteredChildren = filterTree(goal.subGoals);
        if (matchesFilters(goal) || filteredChildren.length > 0) {
          return [{ ...goal, subGoals: filteredChildren }];
        }
        return [];
      });

    return filterTree(goalsData.rootGoals);
  }, [cycleFilter, goalsData.rootGoals, searchQuery, statusFilter, typeFilter]);

  const flatFilteredGoals = useMemo(() => flattenGoalTree(filteredGoals), [filteredGoals]);

  const cycleOptions = useMemo(() => {
    const values = new Set<string>();
    for (const goal of goalsData.goals) {
      const cycle = formatCycle(goal.targetDate);
      if (cycle !== "No target") {
        values.add(cycle);
      }
    }
    return [...values].sort();
  }, [goalsData.goals]);

  const ownerOptions = useMemo(
    () =>
      goalsData.members.map((member) => ({
        id: member.id,
        label: member.fullName,
        avatarUrl: member.avatarUrl,
      })),
    [goalsData.members],
  );

  const goalOptions = useMemo(
    () =>
      goalsData.goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
      })),
    [goalsData.goals],
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark relative">
      <GoalsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        cycleFilter={cycleFilter}
        onCycleFilterChange={setCycleFilter}
        cycleOptions={cycleOptions}
        onNewGoal={() => {
          setCreateParentGoalId(null);
          setIsCreateModalOpen(true);
        }}
      />

      <GoalsSummary data={flatFilteredGoals} />

      <div className="flex-1 flex overflow-hidden relative">
        {goalsData.goalsQuery.isLoading ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background-dark">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="size-8 text-primary animate-spin" />
              <div className="text-[13px] text-slate-400 font-medium">Loading goals...</div>
            </div>
          </div>
        ) : goalsData.goalsQuery.isError ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background-dark">
            <div className="flex flex-col items-center gap-4 max-w-sm text-center">
              <div className="size-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2">
                <AlertTriangle className="size-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-200">Goals failed to load</h3>
              <p className="text-[13px] text-slate-400 mb-4">
                We could not load live goal data for this workspace.
              </p>
              <button
                onClick={() => void goalsData.goalsQuery.refetch()}
                className="h-9 px-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-sm text-[13px] font-medium text-slate-200 transition-colors flex items-center gap-2"
              >
                <RefreshCcw className="size-4" />
                Try Again
              </button>
            </div>
          </div>
        ) : flatFilteredGoals.length === 0 ? (
          <div className="flex-1">
            <EmptyState
              icon={Target}
              title={
                searchQuery || statusFilter !== "All" || typeFilter !== "All" || cycleFilter !== "All"
                  ? "No goals match your filters"
                  : "No goals defined"
              }
              description={
                searchQuery || statusFilter !== "All" || typeFilter !== "All" || cycleFilter !== "All"
                  ? "Try adjusting your search or filter criteria."
                  : "Set your first objective to track progress toward your targets."
              }
              actionLabel="Create Goal"
              onAction={() => {
                setCreateParentGoalId(null);
                setIsCreateModalOpen(true);
              }}
            />
          </div>
        ) : (
          <GoalsSurface
            data={filteredGoals}
            selectedGoalId={selectedGoalId}
            onGoalSelect={setSelectedGoalId}
          />
        )}

        <AnimatePresence>
          {goalsData.selectedGoal ? (
            <div className="absolute top-0 right-0 bottom-0 z-20">
              <GoalsDetail
                key={goalsData.selectedGoal.id}
                goal={goalsData.selectedGoal}
                owners={ownerOptions}
                availableProjects={goalsData.projects}
                isSaving={goalsData.isSavingGoal}
                isDeleting={goalsData.isDeletingGoal}
                isLinkingProject={goalsData.isLinkingGoalProject}
                isCreatingInitiative={goalsData.isCreatingInitiative}
                onClose={() => setSelectedGoalId(null)}
                onSave={async (input) => {
                  await goalsData.updateGoal(goalsData.selectedGoal!.id, input);
                }}
                onDelete={async () => {
                  await goalsData.deleteGoal(goalsData.selectedGoal!.id);
                  setSelectedGoalId(null);
                }}
                onLinkProject={async (projectId) => {
                  await goalsData.linkProject(goalsData.selectedGoal!.id, projectId);
                }}
                onCreateInitiative={async (input) => {
                  await goalsData.createInitiative(goalsData.selectedGoal!.id, input);
                }}
                onCreateSubGoal={() => {
                  setCreateParentGoalId(goalsData.selectedGoal!.id);
                  setIsCreateModalOpen(true);
                }}
              />
            </div>
          ) : null}
        </AnimatePresence>
      </div>

      <CreateGoalModal
        key={`${isCreateModalOpen ? "open" : "closed"}-${createParentGoalId ?? "root"}`}
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateParentGoalId(null);
        }}
        owners={ownerOptions}
        goals={goalOptions.filter((goal) => goal.id !== createParentGoalId)}
        defaultOwnerId={goalsData.currentUser?.id ?? null}
        defaultParentGoalId={createParentGoalId}
        isSubmitting={goalsData.isSavingGoal}
        onCreate={async (input) => {
          await goalsData.createGoal(input);
          setIsCreateModalOpen(false);
          setCreateParentGoalId(null);
        }}
      />
    </div>
  );
}
