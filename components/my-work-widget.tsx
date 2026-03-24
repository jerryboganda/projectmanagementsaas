"use client";

import { motion } from "motion/react";
import { Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DashboardTaskItem } from "@/lib/dashboard/types";

const fallbackTasks: DashboardTaskItem[] = [
  {
    id: "LP-101",
    title: "Refactor auth middleware for Edge Runtime",
    status: "in-progress",
    priority: "Urgent",
    project: "Core Platform",
    dueLabel: "Today",
    dueTone: "danger",
  },
  {
    id: "LP-108",
    title: "Fix race condition in project sync",
    status: "in-review",
    priority: "High",
    project: "Core Platform",
    dueLabel: "Tomorrow",
    dueTone: "warning",
  },
  {
    id: "LP-115",
    title: "Update SDK documentation for v4.2",
    status: "todo",
    priority: "Medium",
    project: "Documentation",
    dueLabel: "Nov 02",
    dueTone: "muted",
  },
  {
    id: "LP-122",
    title: "Design notification preferences panel",
    status: "todo",
    priority: "Medium",
    project: "Growth",
    dueLabel: "Nov 05",
    dueTone: "muted",
  },
];

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  "in-progress": { icon: Clock, color: "text-primary", label: "In Progress" },
  "in-review": { icon: AlertCircle, color: "text-amber-500", label: "In Review" },
  "todo": { icon: CheckCircle2, color: "text-slate-500", label: "To Do" },
};

interface MyWorkWidgetProps {
  tasks?: DashboardTaskItem[];
  isLoading?: boolean;
}

function dueToneClass(tone: DashboardTaskItem["dueTone"]) {
  if (tone === "danger") {
    return "text-rose-500";
  }

  if (tone === "warning") {
    return "text-amber-500";
  }

  return "text-slate-500";
}

export function MyWorkWidget({ tasks, isLoading = false }: MyWorkWidgetProps) {
  const items = tasks ?? fallbackTasks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
      className="border border-neutral-border bg-neutral-surface rounded-sm"
    >
      <div className="px-4 py-3 border-b border-neutral-border flex items-center justify-between">
        <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-100 flex items-center gap-2">
          <Clock className="size-3.5 text-slate-400" />
          My Work
        </h3>
        <Link href="/board" className="text-[11px] font-mono text-slate-500 hover:text-primary flex items-center gap-1 transition-colors">
          View Board
          <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="divide-y divide-neutral-border">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={`my-work-loading-${index}`} className="flex items-center gap-3 px-4 py-3">
              <div className="size-4 rounded-full bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-white/5" />
                <div className="h-2 w-1/3 rounded bg-white/5" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[13px] text-slate-300">No assigned work right now.</p>
            <p className="mt-1 text-[11px] text-slate-500">Your active tasks will show up here.</p>
          </div>
        ) : items.map((task, i) => {
          const config = statusConfig[task.status] || statusConfig.todo;
          const StatusIcon = config.icon;
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] cursor-pointer transition-colors group"
            >
              <StatusIcon className={`size-4 flex-shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500">{task.id}</span>
                  <span className="text-[13px] text-slate-200 group-hover:text-white truncate transition-colors">{task.title}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">{task.project}</span>
              <span className={`text-[10px] font-mono flex-shrink-0 ${dueToneClass(task.dueTone)}`}>
                {task.dueLabel}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
