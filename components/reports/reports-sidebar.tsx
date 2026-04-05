'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  Activity,
  Users,
  Target,
  Wallet,
  MoreHorizontal,
  Settings,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LIVE_REPORT_CATALOG,
  PLANNED_REPORT_CATALOG,
  type LiveReportId,
  type PlannedReportId,
  type ReportCatalogItem,
  type ReportSidebarId,
} from './data';

interface ReportsSidebarProps {
  catalog?: ReportCatalogItem[];
  selectedReportId: ReportSidebarId;
  onSelectReport: (id: ReportSidebarId) => void;
}

const LIVE_ICONS: Record<LiveReportId, ReactNode> = {
  'project-health': <BarChart3 className="w-4 h-4" />,
  'team-velocity': <Activity className="w-4 h-4" />,
  'workload': <Users className="w-4 h-4" />,
};

const PLANNED_ICONS: Record<PlannedReportId, ReactNode> = {
  'goals': <Target className="w-4 h-4" />,
  'financial': <Wallet className="w-4 h-4" />,
};

export function ReportsSidebar({
  catalog = LIVE_REPORT_CATALOG,
  selectedReportId,
  onSelectReport,
}: ReportsSidebarProps) {

  return (
    <div className="w-64 flex-shrink-0 border-r border-neutral-border bg-background-dark flex flex-col h-full z-10">
      {/* Header */}
      <div className="p-4 border-b border-neutral-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">Reports</h2>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">

        {/* Standard Reports */}
        <div className="mb-6">
        <div className="px-4 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Standard</div>
          <div className="space-y-0.5">
            {catalog.map(cat => (
              <div
                key={cat.id}
                className={cn(
                  "flex items-center px-4 py-1.5 mx-2 rounded-md cursor-pointer text-sm transition-colors group",
                  selectedReportId === cat.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                )}
                onClick={() => onSelectReport(cat.id)}
              >
                <span className="mr-3 text-slate-400 group-hover:text-inherit">{LIVE_ICONS[cat.id]}</span>
                <span className="flex-1">{cat.label}</span>
                {selectedReportId === cat.id && (
                  <motion.div layoutId="active-report-indicator" className="w-1 h-1 rounded-full bg-primary ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Planned Reports - Now Clickable */}
        <div className="mb-6">
          <div className="px-4 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Upcoming</span>
            <button className="text-slate-500 hover:text-slate-300 transition-colors">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5 mt-2">
            {PLANNED_REPORT_CATALOG.map(report => (
              <div
                key={report.id}
                className={cn(
                  "flex items-center px-4 py-1.5 mx-2 rounded-md cursor-pointer text-sm transition-colors group",
                  selectedReportId === report.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-white/5 text-slate-500 hover:text-slate-300'
                )}
                onClick={() => onSelectReport(report.id)}
              >
                <span className={cn(
                  "mr-3 transition-colors",
                  selectedReportId === report.id ? 'text-primary' : 'text-slate-600 group-hover:text-slate-400'
                )}>
                  {PLANNED_ICONS[report.id]}
                </span>
                <span className="truncate flex-1">{report.label}</span>
                {selectedReportId === report.id ? (
                  <motion.div layoutId="active-report-indicator" className="w-1 h-1 rounded-full bg-primary ml-2" />
                ) : (
                  <span className="rounded-sm border border-neutral-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                    Soon
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
