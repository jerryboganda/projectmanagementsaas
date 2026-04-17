"use client";

import { motion } from "motion/react";
import { Plus, Briefcase, FileText, Target, Calendar, Zap } from "lucide-react";
import { distance, transitions, press } from "@/lib/motion";

export type QuickActionType = "new-task" | "new-project" | "new-doc" | "new-goal" | "new-event";

const actions: { icon: typeof Plus; label: string; actionType: QuickActionType; shortcut?: string; color: string }[] = [
  { icon: Plus, label: "New Task", actionType: "new-task", shortcut: "C", color: "bg-primary/10 text-primary border-primary/20" },
  { icon: Briefcase, label: "New Project", actionType: "new-project", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { icon: FileText, label: "New Doc", actionType: "new-doc", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { icon: Target, label: "New Goal", actionType: "new-goal", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { icon: Calendar, label: "New Event", actionType: "new-event", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
];

interface QuickActionsProps {
  onAction?: (actionType: QuickActionType) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance.md }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.base}
      className="flex items-center gap-2 overflow-x-auto pb-1"
    >
      <Zap className="size-3.5 text-slate-600 flex-shrink-0" />
      <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider flex-shrink-0">Quick</span>
      <div className="flex gap-2">
        {actions.map((action) => (
          <motion.button
            key={action.label}
            whileTap={press.firm}
            onClick={() => onAction?.(action.actionType)}
            className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-sm text-[11px] font-medium transition-colors hover:brightness-110 flex-shrink-0 ${action.color}`}
          >
            <action.icon className="size-3" />
            {action.label}
            {action.shortcut && (
              <kbd className="text-[9px] font-mono opacity-50 ml-1">{action.shortcut}</kbd>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
