"use client";

import { motion } from "motion/react";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DashboardTaskItem } from "@/lib/dashboard/types";

const fallbackIssues: DashboardTaskItem[] = [
  { id: "LP-101", title: "Refactor auth middleware for Edge Runtime", priority: "Urgent", status: "in-progress", dueLabel: "Today", dueTone: "danger", project: "Workspace" },
  { id: "LP-105", title: "API Rate limiting configuration UI", priority: "High", status: "todo", dueLabel: "Oct 24", dueTone: "muted", project: "Workspace" },
  { id: "LP-108", title: "Fix race condition in project sync", priority: "High", status: "in-review", dueLabel: "Oct 25", dueTone: "muted", project: "Workspace" },
  { id: "LP-112", title: "Mobile navigation accessibility audit", priority: "Low", status: "todo", dueLabel: "Oct 28", dueTone: "muted", project: "Workspace" },
  { id: "LP-115", title: "Update SDK documentation for v4.2", priority: "Medium", status: "todo", dueLabel: "Nov 02", dueTone: "muted", project: "Workspace" },
];

const PriorityBadge = ({ priority }: { priority: string }) => {
  let colors = "";
  switch (priority) {
    case "Urgent": colors = "bg-rose-500/10 text-rose-500 border-rose-500/20"; break;
    case "High": colors = "bg-amber-500/10 text-amber-500 border-amber-500/20"; break;
    case "Medium": colors = "bg-slate-500/10 text-slate-400 border-slate-500/20"; break;
    case "Low": colors = "bg-slate-500/10 text-slate-500 border-slate-500/20"; break;
  }
  return (
    <span className={`px-2 py-0.5 text-[10px] border rounded-sm ${colors}`}>
      {priority}
    </span>
  );
};

const StatusIcon = ({ status }: { status: DashboardTaskItem["status"] }) => {
  switch (status) {
    case "in-progress":
      return <span className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(19,19,236,0.6)]" />;
    case "in-review":
      return <span className="size-2 rounded-full bg-primary/40" />;
    default:
      return <span className="size-2 border border-slate-600 rounded-sm" />;
  }
};

function formatStatus(status: DashboardTaskItem["status"]) {
  switch (status) {
    case "in-progress":
      return "In Progress";
    case "in-review":
      return "In Review";
    default:
      return "To Do";
  }
}

interface IssueListProps {
  issues?: DashboardTaskItem[];
  isLoading?: boolean;
}

export function IssueList({ issues, isLoading = false }: IssueListProps) {
  const items = issues ?? fallbackIssues;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      className="border border-neutral-border bg-neutral-surface overflow-hidden rounded-sm flex flex-col"
    >
      <div className="px-4 py-3 border-b border-neutral-border flex items-center justify-between">
        <h3 className="text-[12px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-100">
          <AlertCircle className="size-4 text-slate-400" />
          Personal Triage
        </h3>
        <Link href="/board" className="text-[11px] font-mono text-slate-500 hover:text-primary flex items-center gap-1 transition-colors">
          View All
          <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="h-9 bg-white/[0.02] border-b border-neutral-border">
              <th className="px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-normal">ID</th>
              <th className="px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-normal">Title</th>
              <th className="px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-normal hidden sm:table-cell">Priority</th>
              <th className="px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-normal hidden md:table-cell">Status</th>
              <th className="px-4 text-[11px] font-mono text-slate-500 uppercase tracking-wider font-normal text-right">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`issue-loading-${index}`} className="h-12">
                  <td className="px-4" colSpan={5}>
                    <div className="h-3 w-full rounded bg-white/5" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr className="h-20">
                <td className="px-4 text-center text-[13px] text-slate-400" colSpan={5}>
                  No open items in your personal triage queue.
                </td>
              </tr>
            ) : items.map((issue, i) => (
              <motion.tr
                key={issue.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                className="h-10 hover:bg-white/[0.04] group cursor-pointer transition-colors"
              >
                <td className="px-4 text-[12px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors">{issue.id}</td>
                <td className="px-4 text-[13px] text-slate-200 group-hover:text-white transition-colors">
                  <span className="line-clamp-1">{issue.title}</span>
                </td>
                <td className="px-4 hidden sm:table-cell">
                  <PriorityBadge priority={issue.priority} />
                </td>
                <td className="px-4 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={issue.status} />
                    <span className="text-[12px] text-slate-400 group-hover:text-slate-300 transition-colors">{formatStatus(issue.status)}</span>
                  </div>
                </td>
                <td className={`px-4 text-[12px] font-mono text-right group-hover:text-slate-400 transition-colors ${issue.dueTone === "danger" ? "text-rose-500" : issue.dueTone === "warning" ? "text-amber-500" : "text-slate-500"}`}>
                  {issue.dueLabel}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
