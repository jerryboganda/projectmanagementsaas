"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Target, TrendingUp, XCircle } from "lucide-react";

interface GoalSummaryItem {
  id: string;
  status: string;
  progress: number;
}

interface Props {
  data: GoalSummaryItem[];
}

export function GoalsSummary({ data }: Props) {
  const summary = useMemo(() => {
    let onTrack = 0;
    let atRisk = 0;
    let offTrack = 0;
    let completed = 0;
    let cancelled = 0;
    let totalProgress = 0;

    for (const item of data) {
      if (item.status === "OnTrack") {
        onTrack++;
      } else if (item.status === "AtRisk") {
        atRisk++;
      } else if (item.status === "OffTrack") {
        offTrack++;
      } else if (item.status === "Completed") {
        completed++;
      } else if (item.status === "Cancelled") {
        cancelled++;
      }

      totalProgress += item.progress;
    }

    return {
      total: data.length,
      onTrack,
      atRisk,
      offTrack,
      completed,
      cancelled,
      averageProgress: data.length > 0 ? totalProgress / data.length : 0,
    };
  }, [data]);

  return (
    <div className="h-16 border-b border-neutral-border bg-neutral-surface/30 flex items-center px-6 gap-8 shrink-0">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <Target className="size-4 text-primary" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Avg Progress
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-slate-100">
              {summary.averageProgress.toFixed(0)}%
            </span>
            <span className="text-[12px] text-slate-400">across {summary.total} items</span>
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-neutral-border" />

      <div className="flex items-center gap-6 flex-1">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-500" /> On Track
          </span>
          <span className="text-[14px] font-medium text-emerald-400">{summary.onTrack}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <AlertTriangle className="size-3 text-amber-500" /> At Risk
          </span>
          <span className="text-[14px] font-medium text-amber-400">{summary.atRisk}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <XCircle className="size-3 text-rose-500" /> Off Track
          </span>
          <span className="text-[14px] font-medium text-rose-400">{summary.offTrack}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckCircle2 className="size-3 text-indigo-500" /> Completed
          </span>
          <span className="text-[14px] font-medium text-indigo-400">{summary.completed}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <XCircle className="size-3 text-slate-500" /> Cancelled
          </span>
          <span className="text-[14px] font-medium text-slate-400">{summary.cancelled}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-[11px] text-slate-500">Trend:</div>
        <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20">
          <TrendingUp className="size-3" />
          <span className="text-[11px] font-medium">Live workspace data</span>
        </div>
      </div>
    </div>
  );
}
