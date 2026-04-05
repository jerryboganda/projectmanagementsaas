"use client";

import Image from "next/image";
import { motion } from "motion/react";
import {
  Activity,
  CheckCircle2,
  CircleDashed,
  Clock3,
  MoreHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPriorityLabel,
  getPriorityTone,
  getTaskStatusLabel,
  getTaskStatusTone,
  getWorkloadToneClasses,
  getWorkloadToneLabel,
  type WorkloadMemberView,
  type WorkloadTaskView,
} from "./data";
import type { ReactNode } from "react";

interface Props {
  members: WorkloadMemberView[];
  selectedMemberId: string | null;
  onMemberSelect: (memberId: string | null) => void;
  tasks: WorkloadTaskView[];
}

function getToneIcon(tone: WorkloadMemberView["workloadTone"]) {
  switch (tone) {
    case "idle":
      return CircleDashed;
    case "balanced":
      return CheckCircle2;
    case "watch":
      return Activity;
    case "busy":
      return Clock3;
  }
}

export function WorkloadSurface({ members, selectedMemberId, onMemberSelect, tasks }: Props) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background-dark">
      <div className="flex items-center justify-between border-b border-neutral-border bg-neutral-surface/30 px-4 py-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Users className="size-4" />
          <span className="text-xs uppercase tracking-[0.22em]">Member workload</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Sparkles className="size-4 text-primary/80" />
          <span className="text-xs">Derived from live tasks and time entries</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-3">
          {members.map((member) => {
            const ToneIcon = getToneIcon(member.workloadTone);
            const isSelected = selectedMemberId === member.userId;

            return (
              <motion.button
                key={member.userId}
                type="button"
                layout
                onClick={() => onMemberSelect(member.userId)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-colors",
                  isSelected
                    ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-neutral-border bg-white/[0.02] hover:bg-white/[0.04]",
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-100">
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt={member.fullName}
                          width={44}
                          height={44}
                          className="size-full object-cover"
                        />
                      ) : (
                        member.fullName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase() ?? "")
                          .join("")
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100">{member.fullName}</span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-[0.2em]",
                            getWorkloadToneClasses(member.workloadTone),
                          )}
                        >
                          <ToneIcon className="size-3" />
                          {getWorkloadToneLabel(member.workloadTone)}
                        </span>
                      </div>

                      <div className="mt-1 text-[13px] text-slate-500">
                        {member.activeTaskCount} active task{member.activeTaskCount === 1 ? "" : "s"} -{" "}
                        {member.completedTasks} completed - {member.totalPoints} points -{" "}
                        {member.totalHoursLogged.toFixed(1)}h logged
                      </div>

                      {member.topProjects.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {member.topProjects.map((project) => (
                            <span
                              key={project}
                              className="rounded-full border border-neutral-border bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400"
                            >
                              {project}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                    <Metric label="Assigned" value={member.assignedTasks} />
                    <Metric label="Completed" value={member.completedTasks} />
                    <Metric label="Completion" value={`${member.completionRate.toFixed(0)}%`} />
                  </div>
                </div>

                {member.topTasks.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {member.topTasks.map((task) => (
                      <span
                        key={task}
                        className="rounded-lg border border-neutral-border bg-black/10 px-2.5 py-1 text-[11px] text-slate-500"
                      >
                        {task}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-[12px] text-slate-600">No active tasks assigned yet.</div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {tasks.slice(0, 6).map((task) => {
            const priorityTone = getPriorityTone(task.priority);
            const statusTone = getTaskStatusTone(task.status);

            return (
              <div
                key={task.id}
                className="rounded-2xl border border-neutral-border bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-100">{task.title}</div>
                    <div className="mt-1 text-[12px] text-slate-500">{task.projectName}</div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-200"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone={priorityTone}>{getPriorityLabel(task.priority)}</Badge>
                  <Badge tone={statusTone}>{getTaskStatusLabel(task.status)}</Badge>
                </div>

                <div className="mt-3 text-[12px] text-slate-500">
                  {task.assigneeName ?? "Unassigned"} - {task.isOverdue ? "Overdue" : "Up to date"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-[84px] rounded-xl border border-neutral-border bg-white/[0.02] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
