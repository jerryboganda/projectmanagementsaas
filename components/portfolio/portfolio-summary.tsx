import type { PortfolioGoalItem } from "@/lib/portfolio/types";
import { motion } from "motion/react";
import { Target, Activity, AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import type { ComponentType } from "react";

interface Props {
  goals: PortfolioGoalItem[];
}

export function PortfolioSummary({ goals }: Props) {
  const total = goals.length;
  const onTrack = goals.filter((goal) => goal.status === "OnTrack").length;
  const atRisk = goals.filter((goal) => goal.status === "AtRisk").length;
  const offTrack = goals.filter((goal) => goal.status === "OffTrack").length;
  const completed = goals.filter((goal) => goal.status === "Completed").length;
  const totalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0);
  const objectives = goals.filter((goal) => goal.type === "Objective").length;
  const keyResults = goals.filter((goal) => goal.type === "KeyResult").length;
  const averageProgress = total > 0 ? totalProgress / total : 0;

  return (
    <div className="border-b border-neutral-border bg-neutral-surface/30 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Target className="size-5 text-primary" />
            Strategic Portfolio
          </h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Live goals, sub-goals, and linked initiatives</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider px-2 py-1 border border-neutral-border rounded-sm bg-white/[0.02]">
            Live workspace data
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard 
          title="Total Goals" 
          value={total} 
          icon={CircleDashed} 
          color="text-slate-400" 
          bg="bg-slate-500/10" 
        />
        <SummaryCard 
          title="Objectives" 
          value={objectives} 
          icon={Activity} 
          color="text-blue-500" 
          bg="bg-blue-500/10" 
        />
        <SummaryCard 
          title="Key Results" 
          value={keyResults} 
          icon={CheckCircle2} 
          color="text-emerald-500" 
          bg="bg-emerald-500/10" 
        />
        <SummaryCard 
          title="At Risk" 
          value={atRisk} 
          icon={AlertTriangle} 
          color="text-amber-500" 
          bg="bg-amber-500/10" 
        />
        <SummaryCard 
          title="Avg Progress" 
          value={`${averageProgress.toFixed(0)}%`} 
          icon={Target} 
          color="text-rose-500" 
          bg="bg-rose-500/10" 
        />
      </div>
      <div className="mt-3 text-[12px] text-slate-500">
        {onTrack} on track, {offTrack} off track, {completed} completed
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-md border border-neutral-border bg-background-dark/50 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`size-6 rounded-sm flex items-center justify-center ${bg}`}>
          <Icon className={`size-3.5 ${color}`} />
        </div>
      </div>
      <div className="text-2xl font-semibold text-slate-100">{value}</div>
    </motion.div>
  );
}
