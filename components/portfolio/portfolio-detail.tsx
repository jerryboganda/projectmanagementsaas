"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  ChevronDown,
  Link as LinkIcon,
  Loader2,
  Plus,
  Trash2,
  X,
  Target,
} from "lucide-react";
import Image from "next/image";
import type {
  PortfolioGoalItem,
  PortfolioGoalStatus,
  PortfolioGoalType,
  PortfolioInitiativeStatus,
} from "@/lib/portfolio/types";
import { cn } from "@/lib/utils";

interface PortfolioOwnerOption {
  id: string;
  label: string;
  avatarUrl?: string | null;
}

interface PortfolioProjectOption {
  id: string;
  name: string;
  status?: string;
}

interface Props {
  goal: PortfolioGoalItem;
  owners: PortfolioOwnerOption[];
  availableProjects: PortfolioProjectOption[];
  onClose: () => void;
  onSave: (input: {
    title: string;
    description?: string | null;
    status: PortfolioGoalStatus;
    type: PortfolioGoalType;
    progressPercent?: number | null;
    ownerId?: string | null;
    startDate?: string | null;
    targetDate?: string | null;
    parentGoalId?: string | null;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
  onLinkProject: (projectId: string) => Promise<void>;
  onCreateInitiative: (input: {
    title: string;
    description?: string | null;
    status?: PortfolioInitiativeStatus | null;
    ownerId?: string | null;
    startDate?: string | null;
    targetDate?: string | null;
    progressPercent?: number | null;
  }) => Promise<void>;
  onCreateSubGoal: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  isLinkingProject?: boolean;
  isCreatingInitiative?: boolean;
}

const goalStatusOptions = [
  { value: "OnTrack", label: "On Track" },
  { value: "AtRisk", label: "At Risk" },
  { value: "OffTrack", label: "Off Track" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
] satisfies ReadonlyArray<{ value: PortfolioGoalStatus; label: string }>;

const goalTypeOptions = [
  { value: "Objective", label: "Objective" },
  { value: "KeyResult", label: "Key Result" },
] satisfies ReadonlyArray<{ value: PortfolioGoalType; label: string }>;

const initiativeStatusOptions = [
  { value: "Planned", label: "Planned" },
  { value: "InProgress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
] satisfies ReadonlyArray<{ value: PortfolioInitiativeStatus; label: string }>;

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

function getInitiativeStatusColor(status: string) {
  switch (status) {
    case "Completed":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    case "InProgress":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Cancelled":
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    default:
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }
}

export function PortfolioDetail({
  goal,
  owners,
  availableProjects,
  onClose,
  onSave,
  onDelete,
  onLinkProject,
  onCreateInitiative,
  onCreateSubGoal,
  isSaving = false,
  isDeleting = false,
  isLinkingProject = false,
  isCreatingInitiative = false,
}: Props) {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? "");
  const [status, setStatus] = useState<PortfolioGoalStatus>(goal.status);
  const [type, setType] = useState<PortfolioGoalType>(goal.type);
  const [progress, setProgress] = useState(goal.progress);
  const [ownerId, setOwnerId] = useState(goal.ownerId ?? goal.owner?.id ?? "");
  const [startDate, setStartDate] = useState(goal.startDate?.slice(0, 10) ?? "");
  const [targetDate, setTargetDate] = useState(goal.targetDate?.slice(0, 10) ?? "");
  const [projectToLink, setProjectToLink] = useState("");
  const [isInitiativeFormOpen, setIsInitiativeFormOpen] = useState(false);
  const [initiativeTitle, setInitiativeTitle] = useState("");
  const [initiativeDescription, setInitiativeDescription] = useState("");
  const [initiativeStatus, setInitiativeStatus] =
    useState<PortfolioInitiativeStatus>("Planned");
  const [initiativeOwnerId, setInitiativeOwnerId] = useState(goal.owner?.id ?? "");
  const [initiativeStartDate, setInitiativeStartDate] = useState("");
  const [initiativeTargetDate, setInitiativeTargetDate] = useState("");
  const [initiativeProgress, setInitiativeProgress] = useState("0");

  const linkedProjectIds = useMemo(
    () => new Set(goal.linkedProjects.map((project) => project.id)),
    [goal.linkedProjects],
  );

  const unlinkedProjects = useMemo(
    () => availableProjects.filter((project) => !linkedProjectIds.has(project.id)),
    [availableProjects, linkedProjectIds],
  );

  const budgetlessSave = async () => {
    if (!title.trim()) {
      return;
    }

    await onSave({
      title: title.trim(),
      description: description.trim() || null,
      status,
      type,
      progressPercent: progress,
      ownerId: ownerId || null,
      startDate: startDate || null,
      targetDate: targetDate || null,
      parentGoalId: goal.parentGoalId ?? null,
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this goal? This action cannot be undone.")) {
      return;
    }

    await onDelete();
    onClose();
  };

  const handleLinkProject = async () => {
    if (!projectToLink) {
      return;
    }

    await onLinkProject(projectToLink);
    setProjectToLink("");
  };

  const handleCreateInitiative = async () => {
    if (!initiativeTitle.trim()) {
      return;
    }

    await onCreateInitiative({
      title: initiativeTitle.trim(),
      description: initiativeDescription.trim() || null,
      status: initiativeStatus,
      ownerId: initiativeOwnerId || null,
      startDate: initiativeStartDate || null,
      targetDate: initiativeTargetDate || null,
      progressPercent: Number.parseInt(initiativeProgress, 10) || 0,
    });

    setInitiativeTitle("");
    setInitiativeDescription("");
    setInitiativeStatus("Planned");
    setInitiativeOwnerId(goal.owner?.id ?? "");
    setInitiativeStartDate("");
    setInitiativeTargetDate("");
    setInitiativeProgress("0");
    setIsInitiativeFormOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 450 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 450 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-y-0 right-0 w-full md:w-[450px] bg-neutral-surface border-l border-neutral-border flex flex-col z-20 shadow-2xl"
    >
      <div className="h-14 border-b border-neutral-border flex items-center justify-between px-4 flex-shrink-0 bg-neutral-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border border-neutral-border px-1.5 py-0.5 rounded-sm bg-white/[0.02]">
            {goal.id.slice(0, 8).toUpperCase()}
          </span>
          <span
            className={cn(
              "text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border",
              type === "Objective"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            )}
          >
            {type === "Objective" ? "Objective" : "Key Result"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-sm transition-colors"
            title="Close"
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div>
          <h2 className="text-[22px] font-semibold text-slate-100 leading-tight mb-3">
            {title}
          </h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full text-[14px] text-slate-300 leading-relaxed bg-transparent border border-neutral-border rounded-sm px-2 py-1.5 focus:outline-none focus:border-primary resize-none"
            placeholder="Describe the goal and the outcome it should drive."
          />
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 rounded-md border border-neutral-border bg-background-dark/50">
          <div>
            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">
              Status
            </div>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PortfolioGoalStatus)}
                className={cn(
                  "text-[13px] font-medium bg-transparent border rounded-sm px-2 py-1 w-full cursor-pointer focus:outline-none appearance-none pr-7",
                  getStatusColor(status),
                )}
              >
                {goalStatusOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-neutral-surface text-slate-200">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">
              Progress
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full h-2 appearance-none bg-slate-800 rounded-full cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-surface [&::-webkit-slider-thumb]:shadow-md"
              />
              <span className="text-[12px] font-mono text-slate-400 w-10 text-right">{progress}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PortfolioGoalType)}
              className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
            >
              {goalTypeOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-surface text-slate-200">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Owner
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
            >
              <option value="" className="bg-neutral-surface text-slate-200">
                Unassigned
              </option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id} className="bg-neutral-surface text-slate-200">
                  {owner.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider border-b border-neutral-border pb-2 flex-1">
              Linked Projects
            </h4>
          </div>
          <div className="flex gap-2">
            <select
              value={projectToLink}
              onChange={(e) => setProjectToLink(e.target.value)}
              className="flex-1 bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
            >
              <option value="" className="bg-neutral-surface text-slate-200">
                Select a project to link
              </option>
              {unlinkedProjects.map((project) => (
                <option key={project.id} value={project.id} className="bg-neutral-surface text-slate-200">
                  {project.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => void handleLinkProject()}
              disabled={isLinkingProject || !projectToLink}
              className="h-10 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-neutral-border rounded-sm text-[13px] font-medium text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              type="button"
            >
              {isLinkingProject ? <Loader2 className="size-4 animate-spin" /> : <LinkIcon className="size-4" />}
              Link
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {goal.linkedProjects.length > 0 ? (
              goal.linkedProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-border bg-white/[0.02]"
                >
                  <div className="size-5 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Target className="size-3 text-primary" />
                  </div>
                  <span className="text-[12px] font-medium text-slate-300">{project.name}</span>
                  {project.status ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm border bg-white/[0.04] text-slate-400 border-white/[0.08]">
                      {project.status}
                    </span>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-[13px] text-slate-500">No projects linked yet.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider border-b border-neutral-border pb-2 flex-1">
              Sub-goals ({goal.subGoals.length})
            </h4>
            <button
              onClick={onCreateSubGoal}
              className="ml-3 h-8 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-neutral-border rounded-sm text-[12px] font-medium text-slate-200 transition-colors flex items-center gap-1.5"
              type="button"
            >
              <Plus className="size-3.5" />
              Add Sub-goal
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {goal.subGoals.length > 0 ? (
              goal.subGoals.map((subGoal) => (
                <div
                  key={subGoal.id}
                  className="flex items-center justify-between p-3 rounded-md border border-neutral-border bg-white/[0.02]"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-medium text-slate-200">{subGoal.title}</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{subGoal.type === "Objective" ? "Objective" : "Key Result"}</span>
                      <span>|</span>
                      <span>{formatGoalStatus(subGoal.status)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-medium text-slate-300">{subGoal.progress}%</span>
                    <div className="w-16 h-1.5 bg-neutral-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${subGoal.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-slate-500">No sub-goals yet.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider border-b border-neutral-border pb-2 flex-1">
              Initiatives ({goal.initiatives.length})
            </h4>
            <button
              onClick={() => setIsInitiativeFormOpen((current) => !current)}
              className="ml-3 h-8 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-neutral-border rounded-sm text-[12px] font-medium text-slate-200 transition-colors flex items-center gap-1.5"
              type="button"
            >
              <Plus className="size-3.5" />
              New Initiative
            </button>
          </div>

          {isInitiativeFormOpen ? (
            <div className="p-4 rounded-lg border border-neutral-border bg-white/[0.02] space-y-3">
              <input
                value={initiativeTitle}
                onChange={(event) => setInitiativeTitle(event.target.value)}
                placeholder="Initiative title"
                className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
              />
              <textarea
                value={initiativeDescription}
                onChange={(event) => setInitiativeDescription(event.target.value)}
                rows={3}
                placeholder="Describe the initiative"
                className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={initiativeStatus}
                  onChange={(event) =>
                    setInitiativeStatus(event.target.value as PortfolioInitiativeStatus)
                  }
                  className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
                >
                  {initiativeStatusOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-neutral-surface text-slate-200">
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={initiativeOwnerId}
                  onChange={(event) => setInitiativeOwnerId(event.target.value)}
                  className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
                >
                  <option value="" className="bg-neutral-surface text-slate-200">
                    Unassigned
                  </option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id} className="bg-neutral-surface text-slate-200">
                      {owner.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={initiativeStartDate}
                  onChange={(event) => setInitiativeStartDate(event.target.value)}
                  className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
                />
                <input
                  type="date"
                  value={initiativeTargetDate}
                  onChange={(event) => setInitiativeTargetDate(event.target.value)}
                  className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={initiativeProgress}
                  onChange={(event) => setInitiativeProgress(event.target.value)}
                  placeholder="Progress %"
                  className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsInitiativeFormOpen(false)}
                  className="h-8 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-neutral-border rounded-sm text-[12px] font-medium text-slate-200 transition-colors"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleCreateInitiative()}
                  disabled={isCreatingInitiative}
                  className="h-8 px-3 bg-primary hover:bg-primary/90 border border-primary rounded-sm text-[12px] font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  type="button"
                >
                  {isCreatingInitiative ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Create Initiative
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {goal.initiatives.length > 0 ? (
              goal.initiatives.map((initiative) => (
                <div key={initiative.id} className="p-3 rounded-md border border-neutral-border bg-white/[0.02] flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-[13px] font-medium text-slate-200">{initiative.title}</div>
                      {initiative.description ? <p className="text-[12px] text-slate-500">{initiative.description}</p> : null}
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-sm border text-[10px] font-medium uppercase tracking-wider",
                        getInitiativeStatusColor(initiative.status),
                      )}
                    >
                      {formatGoalStatus(initiative.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>{initiative.owner?.fullName ?? "Unassigned"}</span>
                      <span>{initiative.progress}% complete</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {initiative.startDate ? <span>Start {initiative.startDate}</span> : null}
                      {initiative.targetDate ? <span>Target {initiative.targetDate}</span> : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-slate-500">No initiatives yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-border bg-neutral-surface/50 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => void handleDelete()}
          disabled={isDeleting}
          className="h-9 px-3 bg-white/[0.05] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-[13px] font-medium rounded-sm border border-neutral-border hover:border-rose-500/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Delete
        </button>
        <button
          onClick={() => {
            setStatus("Completed");
            setProgress(100);
          }}
          className="h-9 px-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-sm text-[13px] font-medium transition-colors flex items-center gap-2"
          type="button"
        >
          <CheckCircle2 className="size-4" />
          Mark Complete
        </button>
        <button
          onClick={() => void budgetlessSave()}
          disabled={isSaving}
          className="flex-1 h-9 rounded-sm text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save Changes
        </button>
      </div>
    </motion.div>
  );
}
