"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { AlertTriangle, Briefcase, Loader2, RefreshCcw } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateGoalModal } from "./create-initiative-modal";
import { PortfolioDetail } from "./portfolio-detail";
import { PortfolioGrid } from "./portfolio-grid";
import { PortfolioList } from "./portfolio-list";
import { PortfolioSummary } from "./portfolio-summary";
import { PortfolioToolbar } from "./portfolio-toolbar";
import {
  flattenPortfolioGoalTree,
  type PortfolioGoalItem,
  type PortfolioGoalRow,
} from "@/lib/portfolio/types";
import { usePortfolioData } from "@/hooks/use-portfolio-data";

type GroupKey = "None" | "Status" | "Type" | "Owner";

function filterGoalTree(
  items: PortfolioGoalItem[],
  predicate: (goal: PortfolioGoalItem) => boolean,
): PortfolioGoalItem[] {
  return items.flatMap((goal) => {
    const filteredChildren: PortfolioGoalItem[] = filterGoalTree(goal.subGoals, predicate);
    if (predicate(goal) || filteredChildren.length > 0) {
      return [{ ...goal, subGoals: filteredChildren }];
    }

    return [];
  });
}

export function PortfolioLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [groupBy, setGroupBy] = useState<GroupKey>("None");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createParentGoalId, setCreateParentGoalId] = useState<string | null>(null);

  const portfolioData = usePortfolioData(selectedGoalId);

  const filteredGoals = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const matchesFilters = (goal: PortfolioGoalItem) => {
      const searchText = [
        goal.title,
        goal.description ?? "",
        goal.owner?.fullName ?? "",
        goal.id,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch === "" || searchText.includes(normalizedSearch);
      const matchesStatus = statusFilter === "All" || goal.status === statusFilter;
      const matchesType = typeFilter === "All" || goal.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    };

    return filterGoalTree(portfolioData.rootGoals, matchesFilters);
  }, [portfolioData.rootGoals, searchQuery, statusFilter, typeFilter]);

  const flatFilteredGoals = useMemo(
    () => flattenPortfolioGoalTree(filteredGoals),
    [filteredGoals],
  );

  const groupedGoals = useMemo(() => {
    if (groupBy === "None") {
      return { "All Goals": flatFilteredGoals };
    }

    return flatFilteredGoals.reduce((acc, goal) => {
      const key =
        groupBy === "Status"
          ? goal.status
          : groupBy === "Type"
            ? goal.type
            : goal.owner?.fullName ?? "Unassigned";

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(goal);
      return acc;
    }, {} as Record<string, PortfolioGoalRow[]>);
  }, [flatFilteredGoals, groupBy]);

  const selectedGoal = portfolioData.selectedGoal;
  const ownerOptions = useMemo(
    () =>
      portfolioData.members.map((member) => ({
        id: member.id,
        label: member.fullName,
        avatarUrl: member.avatarUrl,
      })),
    [portfolioData.members],
  );

  const goalOptions = useMemo(
    () =>
      portfolioData.goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
      })),
    [portfolioData.goals],
  );

  const isLoading =
    portfolioData.goalsQuery.isLoading;

  const isError = portfolioData.goalsQuery.isError;

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background-dark">
      <PortfolioSummary goals={flatFilteredGoals} />

      <PortfolioToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        groupBy={groupBy}
        onGroupByChange={(value) => setGroupBy(value as GroupKey)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        goalCount={flatFilteredGoals.length}
        onNewGoal={() => {
          setCreateParentGoalId(null);
          setIsCreateModalOpen(true);
        }}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <div className={`flex-1 overflow-y-auto flex flex-col transition-all duration-300 ${selectedGoalId ? "md:mr-[450px]" : ""}`}>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="size-8 text-primary animate-spin" />
                <div className="text-[13px] text-slate-400 font-medium">Loading portfolio...</div>
              </div>
            </div>
          ) : isError ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                <div className="size-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2">
                  <AlertTriangle className="size-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-200">Portfolio failed to load</h3>
                <p className="text-[13px] text-slate-400 mb-4">
                  We could not load live goal data for this workspace.
                </p>
                <button
                  onClick={() => void portfolioData.goalsQuery.refetch()}
                  className="h-9 px-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-sm text-[13px] font-medium text-slate-200 transition-colors flex items-center gap-2"
                  type="button"
                >
                  <RefreshCcw className="size-4" />
                  Try Again
                </button>
              </div>
            </div>
          ) : flatFilteredGoals.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={
                searchQuery || statusFilter !== "All" || typeFilter !== "All"
                  ? "No goals match your filters"
                  : "No goals yet"
              }
              description={
                searchQuery || statusFilter !== "All" || typeFilter !== "All"
                  ? "Try adjusting your search or filter criteria."
                  : "Create your first goal to start tracking the portfolio."
              }
              actionLabel="New Goal"
              onAction={() => {
                setCreateParentGoalId(null);
                setIsCreateModalOpen(true);
              }}
            />
          ) : (
            <div className="p-6">
              {Object.entries(groupedGoals).map(([groupName, groupGoals]) => (
                <div key={groupName} className="mb-8 last:mb-0">
                  {groupBy !== "None" ? (
                    <h3 className="text-sm font-semibold text-slate-900 mb-4 px-1">
                      {groupName}{" "}
                      <span className="text-slate-400 font-normal ml-2">{groupGoals.length}</span>
                    </h3>
                  ) : null}
                  {viewMode === "list" ? (
                    <PortfolioList
                      goals={groupGoals}
                      selectedId={selectedGoalId}
                      onSelect={setSelectedGoalId}
                      onNewGoal={() => {
                        setCreateParentGoalId(null);
                        setIsCreateModalOpen(true);
                      }}
                    />
                  ) : (
                    <PortfolioGrid
                      goals={groupGoals}
                      selectedId={selectedGoalId}
                      onSelect={setSelectedGoalId}
                      onNewGoal={() => {
                        setCreateParentGoalId(null);
                        setIsCreateModalOpen(true);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedGoal ? (
            <PortfolioDetail
              key={`${selectedGoal.id}-${selectedGoal.updatedAt}-${selectedGoal.linkedProjects.length}-${selectedGoal.initiatives.length}`}
              goal={selectedGoal}
              owners={ownerOptions}
              availableProjects={portfolioData.projects}
              onClose={() => setSelectedGoalId(null)}
              onSave={async (input) => {
                await portfolioData.updateGoal(selectedGoal.id, input);
              }}
              onDelete={async () => {
                await portfolioData.deleteGoal(selectedGoal.id);
                setSelectedGoalId(null);
              }}
              onLinkProject={async (projectId) => {
                await portfolioData.linkProject(selectedGoal.id, projectId);
              }}
              onCreateInitiative={async (input) => {
                await portfolioData.createInitiative(selectedGoal.id, input);
              }}
              onCreateSubGoal={() => {
                setCreateParentGoalId(selectedGoal.id);
                setIsCreateModalOpen(true);
              }}
              isSaving={portfolioData.isSavingGoal}
              isDeleting={portfolioData.isDeletingGoal}
              isLinkingProject={portfolioData.isLinkingGoalProject}
              isCreatingInitiative={portfolioData.isCreatingInitiative}
            />
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
        defaultOwnerId={portfolioData.currentUser?.id ?? null}
        defaultParentGoalId={createParentGoalId}
        isSubmitting={portfolioData.isSavingGoal}
        onCreate={async (input) => {
          await portfolioData.createGoal(input);
          setIsCreateModalOpen(false);
          setCreateParentGoalId(null);
        }}
      />
    </div>
  );
}
