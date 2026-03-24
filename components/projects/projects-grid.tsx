import { motion } from "motion/react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  CheckSquare,
  CircleDashed,
  Clock,
  MoreHorizontal,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProjectSurfaceItem } from "@/lib/projects/types";

interface Props {
  projects: ProjectSurfaceItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onNewProject?: () => void;
}

function getStatusPresentation(status: ProjectSurfaceItem["status"]) {
  if (status === "Completed") {
    return { icon: CheckCircle2, color: "text-emerald-500" };
  }

  if (status === "In Progress") {
    return { icon: Clock, color: "text-blue-500" };
  }

  if (status === "Paused") {
    return { icon: AlertCircle, color: "text-amber-500" };
  }

  return { icon: CircleDashed, color: "text-slate-500" };
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function ProjectsGrid({
  projects,
  selectedId,
  onSelect,
  onToggleFavorite,
  onNewProject,
}: Props) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No projects found"
        description="Try adjusting your filters or create a new project."
        actionLabel="New Project"
        onAction={onNewProject}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isSelected={selectedId === project.id}
          onSelect={() => onSelect(project.id)}
          onToggleFavorite={() => onToggleFavorite(project.id)}
        />
      ))}
    </div>
  );
}

function ProjectCard({
  project,
  isSelected,
  onSelect,
  onToggleFavorite,
}: {
  project: ProjectSurfaceItem;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  const statusPresentation = getStatusPresentation(project.status);
  const StatusIcon = statusPresentation.icon;

  return (
    <motion.div
      layoutId={`project-card-${project.id}`}
      onClick={onSelect}
      className={`group relative flex cursor-pointer flex-col rounded-md border p-4 transition-colors ${
        isSelected
          ? "border-primary/50 bg-white/[0.04] shadow-[0_0_15px_rgba(19,19,236,0.1)]"
          : "border-neutral-border bg-neutral-surface/30 hover:border-slate-600 hover:bg-white/[0.02]"
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-sm border border-neutral-border bg-white/[0.02] px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            {project.identifier}
          </span>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite();
            }}
            className={`rounded-sm p-1 transition-colors ${
              project.isFavorite
                ? "text-amber-400"
                : "text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-400"
            }`}
          >
            <Star className="size-3.5" fill={project.isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
        <button className="rounded-sm p-1 text-slate-500 opacity-0 transition-colors group-hover:opacity-100 hover:text-slate-300">
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <div className="mb-4 flex-1">
        <h3 className="mb-1 line-clamp-1 text-[15px] font-semibold text-slate-100 transition-colors group-hover:text-primary">
          {project.name}
        </h3>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-slate-400">
          {project.description || "No project description yet."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-1.5">
            <StatusIcon className={`size-3.5 ${statusPresentation.color}`} />
            <span className="font-medium text-slate-300">{project.status}</span>
          </div>
          {project.health !== "On Track" ? (
            <span
              className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-medium ${
                project.health === "At Risk"
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-500"
              }`}
            >
              {project.health}
            </span>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full ${
                project.progress === 100 ? "bg-emerald-500" : "bg-primary"
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="border-t border-neutral-border/50 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center overflow-hidden rounded-full border border-neutral-border bg-slate-800 text-[10px] font-medium text-slate-300">
                {project.ownerAvatarUrl ? (
                  <Image
                    src={project.ownerAvatarUrl}
                    alt={project.ownerName}
                    width={28}
                    height={28}
                    className="size-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  getInitials(project.ownerName)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-slate-200">
                  {project.ownerName}
                </p>
                <p className="text-[11px] text-slate-500">Project lead</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <div className="flex items-center gap-1" title="Project tasks">
                <CheckSquare className="size-3.5" />
                <span className="text-[11px] font-mono">
                  {project.completedTaskCount}/{project.taskCount}
                </span>
              </div>
              <div className="flex items-center gap-1" title="Workspace members involved">
                <Users className="size-3.5" />
                <span className="text-[11px] font-mono">
                  {Math.max(project.memberCount, 1)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-500">{project.dueDateLabel}</div>
        </div>
      </div>
    </motion.div>
  );
}
