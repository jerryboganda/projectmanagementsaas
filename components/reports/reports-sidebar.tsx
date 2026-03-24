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
import {
  LIVE_REPORT_CATALOG,
  PLANNED_REPORT_CATALOG,
  type LiveReportId,
  type ReportCatalogItem,
} from './data';

interface ReportsSidebarProps {
  catalog?: ReportCatalogItem[];
  selectedReportId: LiveReportId;
  onSelectReport: (id: LiveReportId) => void;
}

const ICONS: Record<LiveReportId, ReactNode> = {
  'project-health': <BarChart3 className="w-4 h-4" />,
  'team-velocity': <Activity className="w-4 h-4" />,
  'workload': <Users className="w-4 h-4" />,
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
                className={`flex items-center px-4 py-1.5 mx-2 rounded-md cursor-pointer text-sm transition-colors group ${
                  selectedReportId === cat.id 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => onSelectReport(cat.id)}
              >
                <span className="mr-3 text-slate-400 group-hover:text-inherit">{ICONS[cat.id]}</span>
                <span className="flex-1">{cat.label}</span>
                {selectedReportId === cat.id && (
                  <motion.div layoutId="active-report-indicator" className="w-1 h-1 rounded-full bg-primary ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Planned Reports */}
        <div className="mb-6">
          <div className="px-4 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Planned</span>
            <button className="text-slate-500 hover:text-slate-300 transition-colors">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5 mt-2">
            {PLANNED_REPORT_CATALOG.map(report => (
              <div 
                key={report.id}
                className="flex items-center px-4 py-1.5 mx-2 rounded-md text-sm text-slate-600 opacity-80"
              >
                {report.id === 'goals' ? (
                  <Target className="w-4 h-4 mr-3 text-slate-600" />
                ) : (
                  <Wallet className="w-4 h-4 mr-3 text-slate-600" />
                )}
                <span className="truncate flex-1">{report.label}</span>
                <span className="rounded-sm border border-neutral-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                  Planned
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
