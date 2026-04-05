'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ReportsSidebar } from './reports-sidebar';
import { ReportsToolbar } from './reports-toolbar';
import { ReportsSurface, ComingSoonSurface } from './reports-surface';
import { ReportsDetailPanel } from './reports-detail';
import {
  type LiveReportId,
  type PlannedReportId,
  type ReportSidebarId,
  type DateRangePreset,
  type ReportProject,
} from './data';
import { useReportsData } from '@/hooks/use-reports-data';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertTriangle, BarChart3, Loader2 } from 'lucide-react';

const LIVE_REPORT_IDS = new Set<string>(['project-health', 'team-velocity', 'workload']);

function isLiveReportId(id: ReportSidebarId): id is LiveReportId {
  return LIVE_REPORT_IDS.has(id);
}

function isPlannedReportId(id: ReportSidebarId): id is PlannedReportId {
  return id === 'goals' || id === 'financial';
}

export function ReportsLayout() {
  const router = useRouter();
  const [selectedSidebarId, setSelectedSidebarId] = useState<ReportSidebarId>('project-health');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangePreset>('all-time');

  // Always pass a valid LiveReportId to the hook
  const activeReportId: LiveReportId = isLiveReportId(selectedSidebarId)
    ? selectedSidebarId
    : 'project-health';

  const {
    catalog,
    activeReport,
    exportReport,
    selectedReportState,
  } = useReportsData(activeReportId);

  const selectedProject = useMemo<ReportProject | null>(
    () =>
      activeReport?.projects.find((project) => project.id === selectedProjectId) ?? null,
    [activeReport, selectedProjectId],
  );

  const handleSidebarSelect = (id: ReportSidebarId) => {
    setSelectedSidebarId(id);
    setSelectedProjectId(null);
  };

  const isShowingPlanned = isPlannedReportId(selectedSidebarId);

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-background-dark">
      {/* Left Navigation Rail */}
      <ReportsSidebar
        catalog={catalog}
        selectedReportId={selectedSidebarId}
        onSelectReport={handleSidebarSelect}
      />

      {/* Main Reporting Surface */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-neutral-surface/30">
        <ReportsToolbar
          activeReport={isShowingPlanned ? null : activeReport}
          onExport={!isShowingPlanned && activeReport ? async () => exportReport(activeReport.id) : null}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <div className="flex-1 overflow-hidden relative flex">
          {isShowingPlanned ? (
            <ComingSoonSurface reportId={selectedSidebarId as PlannedReportId} />
          ) : selectedReportState.isLoading && !activeReport ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-background-dark/50 backdrop-blur-sm z-10"
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-slate-400">Loading live analytics...</p>
              </div>
            </motion.div>
          ) : selectedReportState.error && !activeReport ? (
            <div className="flex-1">
              <EmptyState
                icon={AlertTriangle}
                title="Reports are unavailable"
                description={
                  selectedReportState.error instanceof Error
                    ? selectedReportState.error.message
                    : "The live analytics queries failed for this workspace."
                }
              />
            </div>
          ) : activeReport ? (
            <ReportsSurface
              key={activeReport.id}
              report={activeReport}
              onSelectProject={(project) => setSelectedProjectId(project.id)}
              selectedProjectId={selectedProject?.id}
            />
          ) : (
            <div className="flex-1">
              <EmptyState
                icon={BarChart3}
                title="Report data is not available yet"
                description="This report does not have enough persisted workspace data yet, even though other live reports may still be available."
              />
            </div>
          )}

          {/* Drill-down Detail Panel */}
          <AnimatePresence>
            {selectedProject ? (
              <ReportsDetailPanel
                project={selectedProject}
                onClose={() => setSelectedProjectId(null)}
                onOpenProject={() => router.push(`/projects?projectId=${selectedProject.id}`)}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
