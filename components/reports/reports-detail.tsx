'use client';

import { motion } from 'motion/react';
import { 
  X, 
  ExternalLink, 
  MoreHorizontal, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity
} from 'lucide-react';
import { ReportProject } from './data';

interface ReportsDetailPanelProps {
  project: ReportProject;
  onClose: () => void;
  onOpenProject: () => void;
}

export function ReportsDetailPanel({ project, onClose, onOpenProject }: ReportsDetailPanelProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'at-risk': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'off-track': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-indigo-500" />;
      default: return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0.5 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 bottom-0 w-[400px] bg-neutral-surface border-l border-neutral-border shadow-2xl flex flex-col z-30"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border/50 bg-background-dark/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/5 rounded-md text-slate-400">
            <Activity className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">Project Detail</h2>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        
        {/* Title & Status */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            {getStatusIcon(project.status)}
            <span className="text-sm font-medium text-slate-300">{getStatusLabel(project.status)}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight leading-tight mb-4">
            {project.name}
          </h1>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-slate-500">Owner:</span>
              <div className="flex items-center gap-1.5">
                {project.owner.avatar ? (
                  <img src={project.owner.avatar} alt={project.owner.name} className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                    {project.owner.initials}
                  </div>
                )}
                <span className="text-slate-200 font-medium">{project.owner.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Health Score & Progress */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border ${getHealthColor(project.healthScore)}`}>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">Health Score</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold tracking-tight">{project.healthScore}</span>
              <span className="text-sm opacity-80 mb-1">/ 100</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-medium opacity-90">
              {project.healthScore >= 80 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {project.healthScore >= 80 ? '+5 pts this week' : '-12 pts this week'}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-border bg-background-dark/50">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Progress</div>
            <div className="flex items-end gap-2 text-slate-200">
              <span className="text-3xl font-bold tracking-tight">{project.progress}%</span>
            </div>
            <div className="mt-3 h-1.5 bg-neutral-border rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  project.status === 'at-risk' ? 'bg-amber-500' : 
                  project.status === 'off-track' ? 'bg-rose-500' : 
                  'bg-emerald-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Key Metrics Breakdown */}
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Metric Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-border/50 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200">Schedule Variance</div>
                  <div className="text-xs text-slate-500">Days behind/ahead</div>
                </div>
              </div>
              <div className={`text-sm font-bold ${project.status === 'on-track' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {project.status === 'on-track' ? '+2 days' : '-5 days'}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-border/50 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200">Open Risks</div>
                  <div className="text-xs text-slate-500">High severity issues</div>
                </div>
              </div>
              <div className="text-sm font-bold text-slate-200">
                {project.status === 'on-track' ? '0' : '3'}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-neutral-border/50">
          <button
            type="button"
            onClick={onOpenProject}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-50 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
          >
            <ExternalLink className="w-4 h-4" />
            Open Project Dashboard
          </button>
        </div>

      </div>
    </motion.div>
  );
}
