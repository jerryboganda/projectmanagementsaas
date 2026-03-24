"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { KpiCard } from "@/components/kpi-card";
import { IssueList } from "@/components/issue-list";
import { RecentActivity } from "@/components/recent-activity";
import { FooterStats } from "@/components/footer-stats";
import { QuickActions, type QuickActionType } from "@/components/quick-actions";
import { MyWorkWidget } from "@/components/my-work-widget";
import { ProjectHealthWidget } from "@/components/project-health-widget";
import { CreateTaskModal } from "@/components/board/create-task-modal";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { CreateGoalModal } from "@/components/goals/create-goal-modal";
import { CreateEventModal } from "@/components/calendar/create-event-modal";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useBoardData } from "@/hooks/use-board-data";
import { useGoalsData } from "@/hooks/use-goals-data";
import { ErrorBoundary } from "@/components/error-boundary";

export default function Dashboard() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<QuickActionType | null>(null);
  const dashboardQuery = useDashboardData();
  const boardData = useBoardData();
  const goalsData = useGoalsData(null);
  const dashboardData = dashboardQuery.data;
  const kpis = dashboardData?.kpis ?? [
    { title: "Cycle Velocity", value: "--", subtitle: "loading metrics", neutral: true },
    { title: "Open Issues", value: "--", subtitle: "loading metrics", neutral: true },
    { title: "Completed", value: "--", subtitle: "loading metrics", neutral: true },
    { title: "Team Capacity", value: "--", subtitle: "loading metrics", neutral: true },
  ];

  const handleQuickAction = useCallback((actionType: QuickActionType) => {
    if (actionType === "new-doc") {
      router.push("/docs");
    } else {
      setActiveModal(actionType);
    }
  }, [router]);

  const closeModal = useCallback(() => setActiveModal(null), []);

  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Dashboard" subtitle="Overview" onNewItem={() => setActiveModal("new-task")} />
        <Breadcrumbs />

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <ErrorBoundary featureName="Dashboard">
          {/* Quick Actions Bar */}
          <QuickActions onAction={handleQuickAction} />

          {dashboardQuery.isError ? (
            <div className="flex flex-col gap-3 rounded-sm border border-rose-500/20 bg-rose-500/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Dashboard data could not be loaded
                </p>
                <p className="mt-1 text-[12px] text-slate-400">
                  The page is still available, but live workspace metrics need another fetch.
                </p>
              </div>
              <button
                onClick={() => void dashboardQuery.refetch()}
                className="rounded-sm border border-rose-500/30 px-3 py-1.5 text-[12px] font-medium text-rose-200 transition-colors hover:bg-rose-500/10"
              >
                {dashboardQuery.isFetching ? "Retrying..." : "Retry"}
              </button>
            </div>
          ) : null}

          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {kpis.map((kpi, index) => (
              <KpiCard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                trend={kpi.trend}
                trendUp={kpi.trendUp}
                neutral={kpi.neutral}
                delay={0.05 + index * 0.05}
                subtitle={kpi.subtitle}
              />
            )) ?? null}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            {/* My Work - takes 8 cols on desktop */}
            <div className="lg:col-span-8 space-y-4 md:space-y-6">
              <MyWorkWidget
                tasks={dashboardData?.myWork}
                isLoading={dashboardQuery.isLoading}
              />
              <IssueList
                issues={dashboardData?.triage}
                isLoading={dashboardQuery.isLoading}
              />
            </div>

            {/* Right sidebar - takes 4 cols on desktop */}
            <div className="lg:col-span-4 space-y-4 md:space-y-6">
              <ProjectHealthWidget
                projects={dashboardData?.projectHealth}
                isLoading={dashboardQuery.isLoading}
              />
              <RecentActivity
                activities={dashboardData?.activity}
                isLoading={dashboardQuery.isLoading}
              />
            </div>
          </div>

          {/* Footer Stats */}
          <FooterStats />
          </ErrorBoundary>
        </div>
      </main>

      {/* Creation Modals */}
      <CreateTaskModal
        key="dashboard-new-task"
        isOpen={activeModal === "new-task"}
        defaultStatus="To Do"
        users={boardData.members}
        projects={boardData.projects}
        isSubmitting={boardData.isSavingTask}
        onClose={closeModal}
        onCreateTask={async (input) => {
          await boardData.createTask(input);
          closeModal();
        }}
      />
      <CreateProjectModal
        isOpen={activeModal === "new-project"}
        onClose={closeModal}
        onCreate={closeModal}
      />
      <CreateGoalModal
        isOpen={activeModal === "new-goal"}
        onClose={closeModal}
        owners={goalsData.members.map((member) => ({
          id: member.id,
          label: member.fullName,
        }))}
        goals={goalsData.goals.map((goal) => ({
          id: goal.id,
          title: goal.title,
        }))}
        isSubmitting={goalsData.isSavingGoal}
        defaultOwnerId={goalsData.currentUser?.id ?? null}
        onCreate={async (input) => {
          await goalsData.createGoal(input);
          closeModal();
        }}
      />
      <CreateEventModal
        isOpen={activeModal === "new-event"}
        onClose={closeModal}
        onCreate={closeModal}
      />
    </>
  );
}
