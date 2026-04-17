"use client";

import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { distance, duration, easing } from "@/lib/motion";

interface KpiCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  neutral?: boolean;
  delay?: number;
  icon?: LucideIcon;
  href?: string;
  subtitle?: string;
}

export function KpiCard({ title, value, trend, trendUp, neutral, delay = 0, icon: Icon, subtitle }: KpiCardProps) {
  const TrendIcon = neutral ? Minus : trendUp ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: distance.md }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.slow, delay, ease: easing.standard }}
      className="p-4 border border-neutral-border bg-neutral-surface flex flex-col gap-1.5 rounded-sm hover:border-slate-700 transition-colors cursor-default group"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <Icon className="size-3.5 text-slate-600 group-hover:text-slate-500 transition-colors" />
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold tracking-tighter text-slate-100">{value}</span>
          {subtitle && (
            <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 mb-1",
            neutral ? "text-slate-500" : trendUp ? "text-emerald-500" : "text-rose-500"
          )}>
            <TrendIcon className="size-3" />
            <span className="text-[11px] font-mono">{trend}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
