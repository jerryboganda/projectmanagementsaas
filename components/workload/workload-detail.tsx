"use client";

import { motion } from "motion/react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ListTodo,
  MoreHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPriorityLabel,
  getPriorityTone,
  getTaskAgeLabel,
  getTaskStatusLabel,
  getTaskStatusTone,
  getWorkloadToneClasses,
  getWorkloadToneLabel,
  type WorkloadMemberView,
  type WorkloadTaskView,
} from "./data";
import type { ComponentType, ReactNode } from "react";

interface Props {
  member: WorkloadMemberView;
  tasks: WorkloadTaskView[];
  onClose: () => void;
}

export function WorkloadDetail({ member, tasks, onClose }: Props) {
  const totalTaskCount = tasks.length;

  return (
    <motion.aside
      initial={{ x: "100%", opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.5 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute right-0 top-0 z-30 flex h-full w-[420px] flex-col border-l border-neutral-border bg-neutral-surface shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-neutral-border/60 bg-background-dark/50 px-4 py-3 backdrop-blur-sm">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Member detail</div>
          <h3 className="truncate text-base font-semibold text-slate-100">{member.fullName}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-200"
          >
            <MoreHorizontal className="size-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-200"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-2xl border border-neutral-border bg-white/[0.02] p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-100">
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.fullName} className="size-full object-cover" />
              ) : (
                member.fullName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("")
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.2em]", getWorkloadToneClasses(member.workloadTone))}>
                  {getWorkloadToneLabel(member.workloadTone)}
                </span>
                <span className="rounded-full border border-neutral-border bg-white/[0.03] px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  {member.activeTaskCount} active
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat label="Assigned" value={member.assignedTasks} icon={ListTodo} />
                <Stat label="Completed" value={member.completedTasks} icon={CheckCircle2} />
                <Stat label="Points" value={member.totalPoints} icon={Sparkles} />
                <Stat label="Hours" value={`${member.totalHoursLogged.toFixed(1)}h`} icon={Clock3} />
              </div>

              <div className="mt-3 text-sm text-slate-500">
                Completion rate: <span className="text-slate-200">{member.completionRate.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-border bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Active tasks</div>
              <div className="mt-1 text-sm text-slate-300">{totalTaskCount} tasks in scope</div>
            </div>
            <Activity className="size-4 text-primary/80" />
          </div>

          <div className="mt-4 space-y-3">
            {tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-border bg-black/10 px-4 py-6 text-center text-sm text-slate-500">
                No assigned tasks were returned for this member.
              </div>
            ) : (
              tasks.map((task) => {
                const priorityTone = getPriorityTone(task.priority);
                const statusTone = getTaskStatusTone(task.status);

                return (
                  <div key={task.id} className="rounded-xl border border-neutral-border bg-black/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-100">{task.title}</div>
                        <div className="mt-1 text-[12px] text-slate-500">{task.projectName}</div>
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]",
                          task.isOverdue ? "border-rose-500/20 bg-rose-500/10 text-rose-400" : "border-neutral-border bg-white/[0.03] text-slate-500",
                        )}
                      >
                        {task.isOverdue ? "Overdue" : getTaskAgeLabel(task)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={priorityTone}>{getPriorityLabel(task.priority)}</Badge>
                      <Badge tone={statusTone}>{getTaskStatusLabel(task.status)}</Badge>
                      {task.estimateHours !== null && task.estimateHours !== undefined ? (
                        <Badge tone="slate">{`${task.estimateHours}h est.`}</Badge>
                      ) : null}
                      {task.estimatePoints !== null && task.estimatePoints !== undefined ? (
                        <Badge tone="slate">{`${task.estimatePoints} pts`}</Badge>
                      ) : null}
                    </div>

                    <div className="mt-3 text-[12px] text-slate-500">
                      {task.assigneeName ?? member.fullName} - {task.labels.length > 0 ? task.labels.join(", ") : "No labels"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-border bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <AlertTriangle className="size-4 text-amber-400" />
            <span className="text-[11px] uppercase tracking-[0.22em]">Live note</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            This workload view is derived from persisted tasks and time entries. The older demo allocation grid is gone until the backend exposes a richer scheduling contract.
          </p>
        </div>
      </div>
    </motion.aside>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-neutral-border bg-white/[0.02] p-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "slate" | "amber" | "blue" | "emerald" | "rose";
  children: ReactNode;
}) {
  const toneClasses = {
    slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em]",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
