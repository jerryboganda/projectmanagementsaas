import type { PortfolioGoalRow } from "@/lib/portfolio/types";
import { useMemo } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ChevronRight,
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
      return <CheckCircle2 className="size-3.5 text-emerald-500" />;
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

export function PortfolioList({ goals, selectedId, onSelect, onNewGoal }: Props) {
  const hasGoals = goals.length > 0;
  const visibleRows = useMemo(() => goals, [goals]);

  if (!hasGoals) {
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
    <div className="border border-neutral-border bg-neutral-surface rounded-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="h-10 bg-white/[0.02] border-b border-neutral-border">
            <th className="px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-normal w-16">ID</th>
            <th className="px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-normal">Goal</th>
            <th className="px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-normal">Status</th>
            <th className="px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-normal">Progress</th>
            <th className="px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-normal">Owner</th>
            <th className="px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-normal">Type</th>
            <th className="px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-normal text-right">Target</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-border">
          {visibleRows.map((goal, index) => (
            <PortfolioRow
              key={goal.id}
              goal={goal}
              index={index}
              isSelected={selectedId === goal.id}
              onSelect={() => onSelect(goal.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PortfolioRow({
  goal,
  index,
  isSelected,
  onSelect,
}: {
  goal: PortfolioGoalRow;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const ownerInitials =
    goal.owner?.fullName
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2) ?? "?";

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      onClick={onSelect}
      className={`h-14 group cursor-pointer transition-colors relative ${
        isSelected ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
      }`}
    >
      {isSelected ? (
        <motion.td
          layoutId="active-indicator"
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
        />
      ) : null}
      <td className="px-4 text-[11px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
        {goal.id.slice(0, 8).toUpperCase()}
      </td>
      <td className="px-4">
        <div className="flex items-center gap-2" style={{ paddingLeft: `${goal.level * 16}px` }}>
          {goal.subGoals.length > 0 ? (
            <ChevronRight className="size-3.5 text-slate-500 rotate-90" />
          ) : (
            <span className="size-1.5 rounded-full bg-slate-600" />
          )}
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`text-[13px] font-medium transition-colors truncate ${
                isSelected ? "text-primary" : "text-slate-200 group-hover:text-white"
              }`}
            >
              {goal.title}
            </span>
            {goal.type === "KeyResult" ? (
              <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                KR
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-mono uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Objective
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4">
        <div className="flex items-center gap-1.5">
          {getStatusIcon(goal.status)}
          <span className="text-[12px] text-slate-300">{formatGoalStatus(goal.status)}</span>
        </div>
      </td>
      <td className="px-4 w-32">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                goal.status === "Completed" ? "bg-emerald-500" : "bg-primary"
              }`}
              style={{ width: `${goal.progress}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
            {goal.progress}%
          </span>
        </div>
      </td>
      <td className="px-4">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-sm bg-slate-800 border border-neutral-border flex items-center justify-center text-[9px] font-medium text-slate-300 overflow-hidden">
            {goal.owner?.avatarUrl ? (
              <Image
                src={goal.owner.avatarUrl}
                alt={goal.owner.fullName}
                width={20}
                height={20}
                className="size-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              ownerInitials
            )}
          </div>
          <span className="text-[12px] text-slate-300">{goal.owner?.fullName ?? "Unassigned"}</span>
        </div>
      </td>
      <td className="px-4">
        <span className="text-[12px] text-slate-400">{goal.type}</span>
      </td>
      <td className="px-4 text-[12px] font-mono text-slate-500 text-right group-hover:text-slate-400 transition-colors">
        {goal.targetDate
          ? new Date(goal.targetDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "No target"}
      </td>
    </motion.tr>
  );
}
