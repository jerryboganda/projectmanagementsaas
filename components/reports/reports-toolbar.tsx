'use client';
import { 
  Download, 
  Filter, 
  Save, 
  Share2,
  RefreshCw,
  Database
} from 'lucide-react';
import { ReportData } from './data';

interface ReportsToolbarProps {
  activeReport: ReportData | null;
  onExport: (() => Promise<void>) | null;
}

export function ReportsToolbar({ activeReport, onExport }: ReportsToolbarProps) {
  return (
    <div className="h-16 border-b border-neutral-border/50 bg-background-dark/80 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
          {activeReport?.title || 'Reports'}
        </h1>
        
        <div className="h-4 w-px bg-neutral-border/50 mx-2"></div>

        <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300">
          <Database className="w-4 h-4" />
          Live workspace data
        </div>

        <button
          disabled
          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-surface border border-neutral-border rounded-md text-sm font-medium text-slate-500 cursor-not-allowed"
          title="Date filtering is planned once richer analytics filters ship."
        >
          <Filter className="w-4 h-4 text-slate-500" />
          Snapshot filters pending
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center text-xs text-slate-500 mr-2">
          <RefreshCw className="w-3 h-3 mr-1.5" />
          Updated {activeReport?.lastUpdated ? new Date(activeReport.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
        </div>

        <button
          onClick={() => void onExport?.()}
          disabled={!onExport}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors disabled:cursor-not-allowed disabled:text-slate-600"
          title="Export"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          disabled
          className="p-2 text-slate-600 rounded-md cursor-not-allowed"
          title="Saved sharing flows are planned, but not shipped in the live analytics contract."
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          disabled
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary/60 rounded-md text-sm font-medium cursor-not-allowed"
          title="Saved report views are still planned."
        >
          <Save className="w-4 h-4" />
          Saved Views Planned
        </button>
      </div>
    </div>
  );
}
