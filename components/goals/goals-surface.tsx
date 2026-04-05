"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Target,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import clsx from "clsx";
import { EmptyState } from "@/components/ui/empty-state";

interface GoalOwner {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

interface GoalTreeItem {
  id: string;
  title: string;
  status: string;
  type: string;
  progress: number;
  owner?: GoalOwner | null;
  targetDate?: string | null;
  subGoals: GoalTreeItem[];
}

interface Props {
  data: GoalTreeItem[];
  selectedGoalId: string | null;
  onGoalSelect: (id: string | null) => void;
}

function formatGoalStatus(status: string) {
  return status.replace(/([A-Z])/g, " $1").trim();
}

function getStatusColor(status: string) {
  switch (status) {
    case "OnTrack":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "AtRisk":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "OffTrack":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "Completed":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    case "Cancelled":
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "OnTrack":
      return <CheckCircle2 className="size-3" />;
    case "AtRisk":
      return <AlertTriangle className="size-3" />;
    case "OffTrack":
      return <XCircle className="size-3" />;
    case "Completed":
      return <CheckCircle2 className="size-3" />;
    case "Cancelled":
      return <CircleDashed className="size-3" />;
    default:
      return <CircleDashed className="size-3" />;
  }
}

export function GoalsSurface({ data, selectedGoalId, onGoalSelect }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set(data.map((item) => item.id)));

  const toggleRow = (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderGoalRow = (item: GoalTreeItem, level = 0) => {
    const isExpanded = expandedRows.has(item.id);
    const isSelected = selectedGoalId === item.id;
    const hasChildren = item.subGoals.length > 0;

    return (
      <div key={item.id} className="flex flex-col">
        <motion.div
          layout
          onClick={() => onGoalSelect(item.id)}
          className={clsx(
            "flex items-center border-b border-neutral-border/50 hover:bg-white/[0.02] transition-colors cursor-pointer group min-h-[48px]",
            isSelected ? "bg-primary/5" : "",
            level === 0 ? "bg-neutral-surface/10" : "",
          )}
        >
          <div
            className="flex-1 min-w-[320px] p-3 flex items-center gap-2"
            style={{ paddingLeft: `${level * 24 + 12}px` }}
          >
            <div className="w-5 flex justify-center shrink-0">
              {hasChildren ? (
                <button
                  onClick={(event) => toggleRow(item.id, event)}
                  className="p-0.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] rounded-sm transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </button>
              ) : (
                <div className="size-1.5 rounded-full bg-slate-600" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "text-[13px] font-medium truncate transition-colors",
                    isSelected ? "text-primary" : "text-slate-200 group-hover:text-primary",
                  )}
                >
                  {item.title}
                </span>
                <span
                  className={clsx(
                    "px-1.5 py-0.5 rounded-sm border text-[9px] font-medium uppercase tracking-wider shrink-0",
                    item.type === "Objective"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  )}
                >
                  {item.type === "Objective" ? "Objective" : "KR"}
                </span>
              </div>
            </div>
          </div>

          <div className="w-[120px] shrink-0 p-3 flex items-center">
            <div
              className={clsx(
                "flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[11px] font-medium",
                getStatusColor(item.status),
              )}
            >
              {getStatusIcon(item.status)}
              {formatGoalStatus(item.status)}
            </div>
          </div>

          <div className="w-[160px] shrink-0 p-3 flex items-center gap-3">
            <span className="text-[12px] font-medium text-slate-300 w-8 text-right">{item.progress}%</span>
            <div className="flex-1 h-1.5 bg-neutral-border rounded-full overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full",
                  item.status === "OnTrack" || item.status === "Completed"
                    ? "bg-emerald-500"
                    : item.status === "AtRisk"
                      ? "bg-amber-500"
                      : item.status === "OffTrack"
                        ? "bg-rose-500"
                        : "bg-slate-500",
                )}
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>

          <div className="w-[110px] shrink-0 p-3 flex items-center">
            <span className="text-[12px] text-slate-400">
              {item.type === "Objective" ? "Objective" : "Key Result"}
            </span>
          </div>

          <div className="w-[180px] shrink-0 p-3 flex items-center gap-2">
            <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-medium text-primary border border-primary/30 overflow-hidden shrink-0">
              {item.owner?.avatarUrl ? (
                <Image src={item.owner.avatarUrl} alt={item.owner.fullName} width={24} height={24} className="w-full h-full object-cover" />
              ) : (
                item.owner?.fullName
                  ?.split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2) ?? "?"
              )}
            </div>
            <span className="text-[12px] text-slate-300 truncate">
              {item.owner?.fullName ?? "Unassigned"}
            </span>
          </div>

          <div className="w-[140px] shrink-0 p-3 flex items-center">
            <span className="text-[12px] text-slate-400">
              {item.targetDate
                ? new Date(item.targetDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No target"}
            </span>
          </div>
        </motion.div>

        <AnimatePresence>
          {isExpanded && hasChildren ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col overflow-hidden"
            >
              {item.subGoals.map((child) => renderGoalRow(child, level + 1))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-dark overflow-hidden">
      <div className="flex items-center border-b border-neutral-border bg-neutral-surface/50 shrink-0">
        <div className="flex-1 min-w-[320px] p-3 pl-12">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Goal</span>
        </div>
        <div className="w-[120px] shrink-0 p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Status</span>
        </div>
        <div className="w-[160px] shrink-0 p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Progress</span>
        </div>
        <div className="w-[110px] shrink-0 p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Type</span>
        </div>
        <div className="w-[180px] shrink-0 p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Owner</span>
        </div>
        <div className="w-[140px] shrink-0 p-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Target</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {data.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals found"
            description="Try adjusting your filters to find what you're looking for."
          />
        ) : (
          data.map((item) => renderGoalRow(item, 0))
        )}
      </div>
    </div>
  );
}
