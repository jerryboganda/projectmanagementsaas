import type { PortfolioGoalRow } from "@/lib/portfolio/types";
import { motion } from "motion/react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Calendar,
  Target,
  Users,
  FolderKanban,
} from "lucide-react";
import Image from "next/image";
import { EmptyState } from "@/components/ui/empty-state";

interface Props {
  goals: PortfolioGoalRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewGoal?: () => void;
}

function formatGoalStatus(status: string) {
  return status.replace(/([A-Z])/g, " $1").trim();
}

function getStatusIcon(status: string) {
  switch (status) {
    case "OnTrack":
      return <Activity className="size-3.5 text-emerald-500" />;
    case "AtRisk":
      return <AlertTriangle className="size-3.5 text-amber-500" />;
    case "OffTrack":
      return <AlertTriangle className="size-3.5 text-rose-500" />;
    case "Completed":
      return <CheckCircle2 className="size-3.5 text-indigo-500" />;
    case "Cancelled":
      return <CircleDashed className="size-3.5 text-slate-500" />;
    default:
      return <CircleDashed className="size-3.5 text-slate-500" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "OnTrack":
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    case "AtRisk":
      return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "OffTrack":
      return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    case "Completed":
      return "text-indigo-500 bg-indigo-500/10 border-indigo-500/20";
    case "Cancelled":
      return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    default:
      return "text-slate-500 bg-slate-500/10 border-slate-500/20";
  }
}

export function PortfolioGrid({ goals, selectedId, onSelect, onNewGoal }: Props) {
  if (goals.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No goals found"
        description="Try adjusting your filters or create a new goal."
        actionLabel="New Goal"
        onAction={onNewGoal}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {goals.map((goal, index) => {
        const ownerInitials =
          goal.owner?.fullName
            ?.split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .slice(0, 2) ?? "?";

        return (
          <motion.button
            key={goal.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 24, delay: index * 0.03 }}
            onClick={() => onSelect(goal.id)}
            className={`
              group relative bg-white/[0.02] border rounded-lg p-5 text-left transition-all duration-200
              hover:bg-white/[0.04] hover:border-neutral-border-hover hover:shadow-md
              ${selectedId === goal.id
                ? "border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(124,58,237,0.1)]"
                : "border-neutral-border"}
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 px-1.5 py-0.5 bg-white/[0.03] rounded border border-white/[0.05]">
                  {goal.id.slice(0, 8).toUpperCase()}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColor(goal.status)}`}>
                  {formatGoalStatus(goal.status)}
                </span>
              </div>
              <div className="size-8 rounded-full bg-white/[0.04] border border-neutral-border flex items-center justify-center">
                {getStatusIcon(goal.status)}
              </div>
            </div>

            <h3 className="text-[15px] font-medium text-slate-200 mb-1 leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {goal.title}
            </h3>

            <div className="flex items-center gap-1.5 mb-4">
              <Target className="size-3.5 text-slate-500" />
              <span className="text-[12px] text-slate-400">{goal.type}</span>
              {goal.subGoals.length > 0 ? (
                <span className="ml-1 text-[11px] text-slate-500">
                  {goal.subGoals.length} sub-goals
                </span>
              ) : null}
            </div>

            <div className="mb-5">
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-slate-400">Progress</span>
                <span className="text-slate-300 font-medium">{goal.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progress}%` }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    goal.status === "OnTrack" || goal.status === "Completed"
                      ? "bg-emerald-500"
                      : goal.status === "AtRisk"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Users className="size-3.5" />
                  <span className="text-[11px]">Owner</span>
                </div>
                <span className="text-[13px] text-slate-300 font-medium truncate">
                  {goal.owner?.fullName ?? "Unassigned"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="size-3.5" />
                  <span className="text-[11px]">Target</span>
                </div>
                <span className="text-[13px] text-slate-300 font-medium">
                  {goal.targetDate
                    ? new Date(goal.targetDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "No target"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-border">
              <div className="flex items-center gap-2">
                <div className="relative size-6 rounded-full overflow-hidden border border-neutral-border bg-neutral-surface flex items-center justify-center">
                  {goal.owner?.avatarUrl ? (
                    <Image
                      src={goal.owner.avatarUrl}
                      alt={goal.owner.fullName}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400">{ownerInitials}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-300 leading-none mb-0.5">
                    {goal.owner?.fullName ?? "Unassigned"}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-none">
                    {goal.subGoals.length} children
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="text-[11px]">{goal.level > 0 ? `Level ${goal.level + 1}` : "Root"}</span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
