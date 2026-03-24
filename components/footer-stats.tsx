"use client";

import { motion } from "motion/react";

export function FooterStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
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
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">API Latency</span>
          <span className="text-xs font-semibold text-slate-200">124ms</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Active Cycles</span>
          <span className="text-xs font-semibold text-slate-200">12</span>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Current Load</span>
        <div className="w-32 h-1.5 bg-neutral-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "68%" }}
            transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
            className="h-full bg-primary"
          />
        </div>
      </div>
    </motion.div>
  );
}
