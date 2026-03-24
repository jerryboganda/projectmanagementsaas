"use client";

import { motion } from "motion/react";
import {
  CheckCircle2,
  Clock3,
  ListTodo,
  PieChart,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type WorkloadSummaryStats } from "./data";

interface Props {
  summary: WorkloadSummaryStats;
}

function formatHours(value: number) {
  return `${value.toFixed(1)}h`;
}

const cards = [
  {
    id: "members",
    label: "Members in scope",
    icon: Users,
    tone: "text-sky-300",
  },
  {
    id: "assigned",
    label: "Assigned tasks",
    icon: ListTodo,
    tone: "text-amber-300",
  },
  {
    id: "completed",
    label: "Completed tasks",
    icon: CheckCircle2,
    tone: "text-emerald-300",
  },
  {
    id: "hours",
    label: "Hours logged",
    icon: Clock3,
    tone: "text-violet-300",
  },
  {
    id: "completion",
    label: "Avg completion",
    icon: PieChart,
    tone: "text-rose-300",
  },
] as const;

export function WorkloadSummary({ summary }: Props) {
  const values = {
    members: summary.totalMembers,
    assigned: summary.assignedTasks,
    completed: summary.completedTasks,
    hours: formatHours(summary.totalHoursLogged),
    completion: `${summary.averageCompletionRate.toFixed(0)}%`,
  } as const;

  return (
    <div className="grid gap-3 border-b border-neutral-border bg-neutral-surface/30 p-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            className="rounded-xl border border-neutral-border/70 bg-white/[0.02] p-4 shadow-sm shadow-black/10"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  {card.label}
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-100">
                  {values[card.id]}
                </div>
              </div>
              <div className={cn("rounded-lg border border-white/5 bg-white/[0.03] p-2", card.tone)}>
                <Icon className="size-4" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

