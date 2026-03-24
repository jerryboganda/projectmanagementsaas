"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  CircleDashed,
  Clock,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Pencil,
  Star,
  Target,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProjectSurfaceItem, ProjectSurfaceStatus, ProjectUpdateInput } from "@/lib/projects/types";

interface Props {
  project: ProjectSurfaceItem;
  onClose: () => void;
  onToggleFavorite: () => void;
  onUpdate?: (projectId: string, updates: ProjectUpdateInput) => void;
  isSaving?: boolean;
}

const statusOptions: ProjectSurfaceStatus[] = [
  "Planning",
  "In Progress",
  "Paused",
  "Completed",
];

function getStatusClasses(status: ProjectSurfaceStatus) {
  if (status === "Completed") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  }

  if (status === "In Progress") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-500";
  }

  if (status === "Paused") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-500";
  }

  return "border-slate-500/20 bg-slate-500/10 text-slate-400";
}

function getHealthClasses(health: ProjectSurfaceItem["health"]) {
  if (health === "On Track") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  }

  if (health === "At Risk") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-500";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-500";
}

function getStatusPresentation(status: ProjectSurfaceStatus) {
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

export function ProjectDetail({
  project,
  onClose,
  onToggleFavorite,
  onUpdate,
  isSaving = false,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState(project.status);
  const [dueDate, setDueDate] = useState(project.dueDateRaw ?? "");

  const statusPresentation = getStatusPresentation(status);
  const StatusIcon = statusPresentation.icon;
  const isOverdue = !!dueDate && new Date(dueDate) < new Date();

  const commitUpdate = (updates: ProjectUpdateInput) => {
    onUpdate?.(project.id, updates);
  };

  const saveName = () => {
    setEditingName(false);
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== project.name) {
      commitUpdate({ name: trimmedName });
    } else {
      setName(project.name);
    }
  };

  const saveDescription = () => {
    setEditingDescription(false);
    const normalizedDescription = description.trim();
    if (normalizedDescription !== project.description) {
      commitUpdate({ description: normalizedDescription });
    } else {
      setDescription(project.description);
    }
  };

  const handleStatusChange = (nextStatus: ProjectSurfaceStatus) => {
    setStatus(nextStatus);
    if (nextStatus !== project.status) {
      commitUpdate({ status: nextStatus });
    }
  };

  const handleDueDateChange = (nextDueDate: string) => {
    setDueDate(nextDueDate);
    if ((nextDueDate || "") !== (project.dueDateRaw ?? "")) {
      commitUpdate({ dueDate: nextDueDate });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-neutral-border bg-neutral-surface shadow-2xl md:w-[400px]"
    >
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-neutral-border bg-neutral-surface/50 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="rounded-sm border border-neutral-border bg-white/[0.02] px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            {project.identifier}
          </span>
          <button
            onClick={onToggleFavorite}
            className={`rounded-sm p-1.5 transition-colors ${
              project.isFavorite
                ? "text-amber-400 hover:bg-amber-400/10"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
            title={project.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className="size-4" fill={project.isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="rounded-sm p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200" title="Open full view">
            <ExternalLink className="size-4" />
          </button>
          <button className="rounded-sm p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200" title="More actions">
            <MoreHorizontal className="size-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-neutral-border" />
          <button
            onClick={onClose}
            className="rounded-sm p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto p-6">
        <div>
          {editingName ? (
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={saveName}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  saveName();
                }
              }}
              autoFocus
              className="mb-2 w-full rounded-sm border border-primary/30 bg-transparent px-2 py-1 text-[20px] font-semibold leading-tight text-slate-100 focus:border-primary focus:outline-none"
            />
          ) : (
            <h2
              onClick={() => setEditingName(true)}
              className="group mb-2 flex cursor-pointer items-center gap-2 text-[20px] font-semibold leading-tight text-slate-100 hover:text-white"
            >
              {name}
              <Pencil className="size-3 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
            </h2>
          )}

          {editingDescription ? (
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onBlur={saveDescription}
              autoFocus
              rows={3}
              className="w-full resize-none rounded-sm border border-primary/30 bg-transparent px-2 py-1.5 text-[14px] leading-relaxed text-slate-400 focus:border-primary focus:outline-none"
            />
          ) : (
            <p
              onClick={() => setEditingDescription(true)}
              className="group cursor-pointer text-[14px] leading-relaxed text-slate-400 hover:text-slate-300"
            >
              {description || (
                <span className="italic text-slate-500">Click to add a project description.</span>
              )}
              <Pencil className="ml-2 inline size-3 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
            </p>
          )}
        </div>

        <div className="rounded-md border border-neutral-border bg-background-dark/50 p-4">
          <div className="flex items-center gap-2">
            <StatusIcon className={`size-4 ${statusPresentation.color}`} />
            <p className="text-[12px] font-medium text-slate-300">Project delivery state</p>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                Status
              </div>
              <select
                value={status}
                onChange={(event) => handleStatusChange(event.target.value as ProjectSurfaceStatus)}
                className={cn(
                  "w-full cursor-pointer appearance-none rounded-sm border px-2 py-1 text-[13px] font-medium focus:outline-none",
                  getStatusClasses(status),
                )}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option} className="bg-neutral-surface text-slate-200">
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-8 w-px bg-neutral-border" />
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                Health
              </div>
              <div
                className={cn(
                  "rounded-sm border px-2 py-1 text-[13px] font-medium",
                  getHealthClasses(project.health),
                )}
              >
                {project.health}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-300">Overall Progress</span>
            <span className="text-[12px] font-mono text-slate-400">{project.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full ${
                project.progress === 100 ? "bg-emerald-500" : "bg-primary"
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-500">
              <Calendar className="size-3.5" />
              Due Date
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => handleDueDateChange(event.target.value)}
              className={cn(
                "w-full cursor-pointer rounded-sm border border-neutral-border bg-transparent px-2 py-1 text-[14px] font-medium transition-colors hover:border-slate-600 focus:border-primary focus:outline-none",
                isOverdue ? "text-rose-500" : "text-slate-200",
              )}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-500">
              <Target className="size-3.5" />
              Members
            </div>
            <div className="text-[14px] font-medium text-slate-200">
              {Math.max(project.memberCount, 1)} workspace members
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-500">
              <CheckSquare className="size-3.5" />
              Tasks
            </div>
            <div className="text-[14px] font-medium text-slate-200">
              {project.completedTaskCount} / {project.taskCount} completed
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-500">
              <FileText className="size-3.5" />
              Visibility
            </div>
            <div className="text-[14px] font-medium capitalize text-slate-200">
              {typeof project.visibility === "string" ? project.visibility.toLowerCase() : "workspace"}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-500">
            <Users className="size-3.5" />
            Project Lead
          </div>
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center overflow-hidden rounded-sm border border-neutral-border bg-slate-800 text-[11px] font-medium text-slate-300">
              {project.ownerAvatarUrl ? (
                <Image
                  src={project.ownerAvatarUrl}
                  alt={project.ownerName}
                  width={32}
                  height={32}
                  className="size-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                getInitials(project.ownerName)
              )}
            </div>
            <div>
              <div className="text-[13px] font-medium text-slate-200">{project.ownerName}</div>
              <div className="text-[11px] text-slate-500">Lead and workspace contact</div>
            </div>
          </div>
        </div>
      </div>

      {isSaving ? (
        <div className="border-t border-neutral-border px-6 py-3 text-[12px] text-slate-500">
          Saving project changes...
        </div>
      ) : null}
    </motion.div>
  );
}
