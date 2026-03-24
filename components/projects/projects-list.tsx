import { motion } from "motion/react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  CircleDashed,
  Clock,
  MoreHorizontal,
  Star,
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

export function ProjectsList({
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
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-neutral-border/50 bg-background-dark/95 px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex w-8 items-center justify-center" />
          <div>Project</div>
          <div>Status</div>
          <div>Progress</div>
          <div>Lead</div>
          <div>Due Date</div>
          <div className="w-8" />
        </div>

        <div className="divide-y divide-neutral-border/50">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              isSelected={selectedId === project.id}
              onSelect={() => onSelect(project.id)}
              onToggleFavorite={() => onToggleFavorite(project.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectRow({
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
    <div
      onClick={onSelect}
      className={`group relative grid cursor-pointer grid-cols-[auto_2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 transition-colors ${
        isSelected ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
      }`}
    >
      {isSelected ? (
        <motion.div
          layoutId="selectedProjectRow"
          className="absolute bottom-0 left-0 top-0 w-[2px] bg-primary"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      ) : null}

      <div className="flex w-8 items-center justify-center">
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
          <Star className="size-4" fill={project.isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-medium text-slate-200 transition-colors group-hover:text-primary">
              {project.name}
            </span>
            {project.health === "At Risk" ? (
              <span className="flex-shrink-0 rounded-sm border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-500">
                At Risk
              </span>
            ) : null}
            {project.health === "Off Track" ? (
              <span className="flex-shrink-0 rounded-sm border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                Off Track
              </span>
            ) : null}
          </div>
          <span className="truncate text-[11px] font-mono text-slate-500">
            {project.identifier}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusIcon className={`size-3.5 ${statusPresentation.color}`} />
        <span className="text-[13px] text-slate-300">{project.status}</span>
      </div>

      <div className="flex items-center gap-3 pr-4">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full ${
              project.progress === 100 ? "bg-emerald-500" : "bg-primary"
            }`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="w-8 text-right text-[12px] font-mono text-slate-400">
          {project.progress}%
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center overflow-hidden rounded-sm border border-neutral-border bg-slate-800 text-[10px] font-medium text-slate-300">
          {project.ownerAvatarUrl ? (
            <Image
              src={project.ownerAvatarUrl}
              alt={project.ownerName}
              width={24}
              height={24}
              className="size-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            getInitials(project.ownerName)
          )}
        </div>
        <span className="truncate text-[13px] text-slate-300">{project.ownerName}</span>
      </div>

      <div className="text-[13px] font-mono text-slate-400">{project.dueDateLabel}</div>

      <div className="flex w-8 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <button className="rounded-sm p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200">
          <MoreHorizontal className="size-4" />
        </button>
      </div>
    </div>
  );
}
