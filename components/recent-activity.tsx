"use client";

import { motion } from "motion/react";
import { MessageSquare, CheckCircle2, AlertTriangle, UserPlus } from "lucide-react";
import type { DashboardActivityItem } from "@/lib/dashboard/types";

const fallbackActivities: DashboardActivityItem[] = [
  {
    id: "1",
    title: "Marcus Chen commented on LP-101",
    snippet: `"We should probably check the redis connection pool size before rolling out this change..."`,
    timeLabel: "2m ago",
    tone: "primary",
  },
  {
    id: "2",
    title: "Sarah J. completed LP-94",
    timeLabel: "45m ago",
    tone: "success",
  },
  {
    id: "3",
    title: "Priority escalated on LP-108",
    timeLabel: "2h ago",
    tone: "warning",
  },
  {
    id: "4",
    title: "Alex Rivera was assigned to 4 issues",
    timeLabel: "5h ago",
    tone: "neutral",
  }
];

const toneConfig = {
  primary: {
    icon: MessageSquare,
    iconColor: "text-primary",
    iconBg: "bg-primary/20",
  },
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/20",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/20",
  },
  neutral: {
    icon: UserPlus,
    iconColor: "text-slate-400",
    iconBg: "bg-slate-500/20",
  },
} satisfies Record<DashboardActivityItem["tone"], { icon: typeof MessageSquare; iconColor: string; iconBg: string }>;

interface RecentActivityProps {
  activities?: DashboardActivityItem[];
  isLoading?: boolean;
}

export function RecentActivity({ activities, isLoading = false }: RecentActivityProps) {
  const items = activities ?? fallbackActivities;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      className="col-span-4 border border-neutral-border bg-neutral-surface h-full rounded-sm flex flex-col"
    >
      <div className="px-4 py-3 border-b border-neutral-border">
        <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-100">Recent Activity</h3>
      </div>
      <div className="p-4 space-y-5 flex-1 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={`activity-loading-${index}`} className="flex gap-3">
              <div className="size-6 rounded-sm bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-white/5" />
                <div className="h-2 w-1/2 rounded bg-white/5" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-slate-300">No recent activity yet.</p>
            <p className="mt-1 text-[11px] text-slate-500">Notifications and actions will appear here.</p>
          </div>
        ) : items.map((activity, i) => {
          const config = toneConfig[activity.tone];
          const Icon = config.icon;

          return (
          <motion.div 
            key={activity.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
            className="flex gap-3 group"
          >
            <div className={`size-6 rounded-sm flex-shrink-0 ${config.iconBg} flex items-center justify-center mt-0.5`}>
              <Icon className={`size-3.5 ${config.iconColor}`} />
            </div>
            <div className="space-y-1.5">
              <p className="text-[12px] text-slate-300 leading-tight">
                {activity.title}
              </p>
              {activity.snippet && (
                <p className="text-[11px] text-slate-500 line-clamp-2 italic leading-relaxed">
                  {activity.snippet}
                </p>
              )}
              <p className="text-[10px] font-mono text-slate-600 group-hover:text-slate-500 transition-colors">{activity.timeLabel}</p>
            </div>
          </motion.div>
        )})}
      </div>
    </motion.div>
  );
}
