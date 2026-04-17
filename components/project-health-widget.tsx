"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DashboardProjectHealthItem } from "@/lib/dashboard/types";
import { distance, stagger, transitions, easing } from "@/lib/motion";

const fallbackProjects: DashboardProjectHealthItem[] = [
  { name: "Core Platform", health: "On Track", progress: 72, tasks: "18/25" },
  { name: "Growth Initiative", health: "At Risk", progress: 45, tasks: "9/20" },
  { name: "Infrastructure v2", health: "On Track", progress: 89, tasks: "32/36" },
  { name: "Security Audit", health: "Off Track", progress: 28, tasks: "5/18" },
];

const healthColors: Record<string, string> = {
  "On Track": "text-emerald-500",
  "At Risk": "text-amber-500",
  "Off Track": "text-rose-500",
};

const progressColors: Record<string, string> = {
  "On Track": "bg-emerald-500",
  "At Risk": "bg-amber-500",
  "Off Track": "bg-rose-500",
};

interface ProjectHealthWidgetProps {
  projects?: DashboardProjectHealthItem[];
  isLoading?: boolean;
}

export function ProjectHealthWidget({ projects, isLoading = false }: ProjectHealthWidgetProps) {
  const items = projects ?? fallbackProjects;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
      className="border border-neutral-border bg-neutral-surface rounded-sm"
    >
      <div className="px-4 py-3 border-b border-neutral-border flex items-center justify-between">
        <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-100">Project Health</h3>
        <Link href="/projects" className="text-[11px] font-mono text-slate-500 hover:text-primary flex items-center gap-1 transition-colors">
          All Projects
          <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="divide-y divide-neutral-border">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={`project-health-loading-${index}`} className="px-4 py-4">
              <div className="mb-3 h-3 w-1/2 rounded bg-white/5" />
              <div className="h-1.5 rounded-full bg-white/5" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[13px] text-slate-300">No projects yet.</p>
            <p className="mt-1 text-[11px] text-slate-500">Project health will appear once work is created.</p>
          </div>
        ) : items.map((project, i) => (
          <motion.div
            key={project.name}
            initial={{ opacity: 0, x: distance.md }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...transitions.base, delay: 0.1 + i * stagger.base }}
            className="px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] text-slate-200 group-hover:text-white transition-colors">{project.name}</span>
              <span className={cn("text-[10px] font-mono", healthColors[project.health])}>
                {project.health}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 bg-neutral-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + i * stagger.relaxed, ease: easing.standard }}
                  className={cn("h-full rounded-full", progressColors[project.health])}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">{project.tasks}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
