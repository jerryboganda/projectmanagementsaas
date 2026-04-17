"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { distance, duration, easing } from "@/lib/motion";

interface FooterStatsProps {
  projectCount?: number;
  completedTasks?: number;
  activeMembers?: number;
  totalMembers?: number;
  teamCapacity?: number;
}

export function FooterStats({
  projectCount,
  completedTasks,
  activeMembers,
  totalMembers,
  teamCapacity,
}: FooterStatsProps) {
  const hasData = projectCount !== undefined;
  const capacityPct = teamCapacity ?? 0;
  const capacityColor =
    capacityPct >= 90
      ? "bg-rose-500"
      : capacityPct >= 70
      ? "bg-amber-500"
      : "bg-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: distance.md }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.slow, delay: 0.2, ease: easing.standard }}
      className="p-4 border border-neutral-border bg-neutral-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-sm"
    >
      <div className="flex flex-wrap gap-6 md:gap-10">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">System Health</span>
          <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            Operational
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Active Projects</span>
          <span className="text-xs font-semibold text-slate-200">{hasData ? projectCount : "--"}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Tasks Completed</span>
          <span className="text-xs font-semibold text-slate-200">{hasData ? completedTasks : "--"}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Active Members</span>
          <span className="text-xs font-semibold text-slate-200">
            {hasData ? `${activeMembers ?? 0} / ${totalMembers ?? 0}` : "--"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap">Team Load</span>
        <div className="w-32 h-1.5 bg-neutral-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${capacityPct}%` }}
            transition={{ duration: 1, delay: 0.4, ease: easing.standard }}
            className={cn("h-full", capacityColor)}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-400">{hasData ? `${capacityPct}%` : "--"}</span>
      </div>
    </motion.div>
  );
}
