"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Link as LinkIcon, Loader2, MoreHorizontal, Pencil, Plus, Target, Trash2, Unlink, X } from "lucide-react";
import clsx from "clsx";
import type {
  GoalInitiativeCreateInput,
  GoalInitiativeSurfaceStatus,
  GoalInitiativeUpdateInput,
  GoalSurfaceItem,
  GoalSurfaceStatus,
  GoalSurfaceType,
  GoalUpdateInput,
} from "@/components/goals/data";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface GoalOwnerOption {
  id: string;
  label: string;
  avatarUrl?: string | null;
}

interface GoalProjectOption {
  id: string;
  name: string;
  status?: string;
}

interface GoalInitiativeItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  progress: number;
  owner?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
  startDate?: string | null;
  targetDate?: string | null;
}

interface Props {
  goal: GoalSurfaceItem;
  owners: GoalOwnerOption[];
  availableProjects: GoalProjectOption[];
  onClose: () => void;
  onSave: (input: GoalUpdateInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onLinkProject: (projectId: string) => Promise<void>;
  onUnlinkProject: (projectId: string) => Promise<void>;
  onCreateInitiative: (input: GoalInitiativeCreateInput) => Promise<void>;
  onUpdateInitiative: (initiativeId: string, input: GoalInitiativeUpdateInput) => Promise<void>;
  onDeleteInitiative: (initiativeId: string) => Promise<void>;
  onCreateSubGoal: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  isLinkingProject?: boolean;
  isUnlinkingProject?: boolean;
  isCreatingInitiative?: boolean;
  isUpdatingInitiative?: boolean;
  isDeletingInitiative?: boolean;
}

const statusOptions = [
  { value: "OnTrack", label: "On Track" },
  { value: "AtRisk", label: "At Risk" },
  { value: "OffTrack", label: "Off Track" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
] satisfies ReadonlyArray<{ value: GoalSurfaceStatus; label: string }>;

const goalTypeOptions = [
  { value: "Objective", label: "Objective" },
  { value: "KeyResult", label: "Key Result" },
] satisfies ReadonlyArray<{ value: GoalSurfaceType; label: string }>;

const initiativeStatusOptions = [
  { value: "Planned", label: "Planned" },
  { value: "InProgress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
] satisfies ReadonlyArray<{ value: GoalInitiativeSurfaceStatus; label: string }>;

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

export function GoalsDetail({
  goal,
  owners,
  availableProjects,
  onClose,
  onSave,
  onDelete,
  onLinkProject,
  onUnlinkProject,
  onCreateInitiative,
  onUpdateInitiative,
  onDeleteInitiative,
  onCreateSubGoal,
  isSaving = false,
  isDeleting = false,
  isLinkingProject = false,
  isUnlinkingProject = false,
  isCreatingInitiative = false,
  isUpdatingInitiative = false,
  isDeletingInitiative = false,
}: Props) {
  const confirm = useConfirm();
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? "");
  const [status, setStatus] = useState<GoalSurfaceStatus>(goal.status);
  const [type, setType] = useState<GoalSurfaceType>(goal.type);
  const [progress, setProgress] = useState(goal.progress);
  const [ownerId, setOwnerId] = useState(goal.ownerId ?? goal.owner?.id ?? "");
  const [startDate, setStartDate] = useState(goal.startDate?.slice(0, 10) ?? "");
  const [targetDate, setTargetDate] = useState(goal.targetDate?.slice(0, 10) ?? "");
  const [projectToLink, setProjectToLink] = useState("");
  const [isInitiativeFormOpen, setIsInitiativeFormOpen] = useState(false);
  const [initiativeTitle, setInitiativeTitle] = useState("");
  const [initiativeDescription, setInitiativeDescription] = useState("");
  const [initiativeStatus, setInitiativeStatus] =
    useState<GoalInitiativeSurfaceStatus>("Planned");
  const [initiativeOwnerId, setInitiativeOwnerId] = useState(goal.owner?.id ?? "");
  const [initiativeStartDate, setInitiativeStartDate] = useState("");
  const [initiativeTargetDate, setInitiativeTargetDate] = useState("");
  const [initiativeProgress, setInitiativeProgress] = useState("0");
  const [editingInitiativeId, setEditingInitiativeId] = useState<string | null>(null);
  const [editInitiativeTitle, setEditInitiativeTitle] = useState("");
  const [editInitiativeStatus, setEditInitiativeStatus] = useState<GoalInitiativeSurfaceStatus>("Planned");
  const [deletingInitiativeId, setDeletingInitiativeId] = useState<string | null>(null);

  const linkedProjectIds = useMemo(
    () => new Set(goal.linkedProjects.map((project) => project.id)),
    [goal.linkedProjects],
  );

  const unlinkedProjects = useMemo(
    () => availableProjects.filter((project) => !linkedProjectIds.has(project.id)),
    [availableProjects, linkedProjectIds],
  );

  const handleSave = async () => {
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
      parentGoalId: null,
    });
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete goal",
      message: "Delete this goal? This action cannot be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;

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
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="w-[520px] h-full bg-neutral-surface border-l border-neutral-border shadow-2xl flex flex-col absolute right-0 top-0 z-50"
    >
      <div className="h-14 border-b border-neutral-border flex items-center justify-between px-4 shrink-0 bg-background-dark/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "px-2 py-0.5 rounded-sm text-[10px] font-medium uppercase tracking-wider shrink-0 border",
              goal.type === "Objective"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            )}
          >
            {goal.type === "Objective" ? "Objective" : "Key Result"}
          </span>
          <h3 className="text-[14px] font-medium text-slate-400 truncate max-w-[240px]">
            {goal.id}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded-sm transition-colors">
            <MoreHorizontal className="size-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded-sm transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col gap-8">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Title
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[20px] font-semibold text-slate-100 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[14px] text-slate-300 focus:outline-none focus:border-primary resize-none"
              placeholder="Describe the goal and how the team will measure success."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-neutral-border bg-white/[0.02] flex flex-col gap-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Status
            </span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as GoalSurfaceStatus)}
              className={cn(
                "px-3 py-1.5 rounded-md border text-[13px] font-medium w-full bg-transparent cursor-pointer focus:outline-none appearance-none",
                getStatusColor(status),
              )}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-surface text-slate-200">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-lg border border-neutral-border bg-white/[0.02] flex flex-col gap-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Type
            </span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as GoalSurfaceType)}
              className="px-3 py-1.5 rounded-md border border-neutral-border text-[13px] font-medium w-full bg-transparent cursor-pointer focus:outline-none text-slate-200"
            >
              {goalTypeOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-surface text-slate-200">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 p-4 rounded-lg border border-neutral-border bg-white/[0.02] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Progress
              </span>
              <span className="text-[16px] font-semibold text-slate-100">{progress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(event) => setProgress(Number(event.target.value))}
              className="w-full h-2.5 appearance-none bg-neutral-border rounded-full cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-surface [&::-webkit-slider-thumb]:shadow-md"
            />
            <div className="text-[12px] text-slate-500">
              Progress source: {goal.progressSource ? formatGoalStatus(goal.progressSource) : "Manual"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Owner
            </label>
            <select
              value={ownerId}
              onChange={(event) => setOwnerId(event.target.value)}
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
              onChange={(event) => setStartDate(event.target.value)}
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
              onChange={(event) => setTargetDate(event.target.value)}
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
              onChange={(event) => setProjectToLink(event.target.value)}
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-border bg-white/[0.02] group"
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
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Unlink project",
                        message: `Unlink "${project.name}" from this goal?`,
                        confirmLabel: "Unlink",
                        tone: "danger",
                      });
                      if (ok) {
                        void onUnlinkProject(project.id);
                      }
                    }}
                    disabled={isUnlinkingProject}
                    className="ml-1 p-0.5 rounded-sm text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Unlink project"
                  >
                    <X className="size-3" />
                  </button>
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
                    setInitiativeStatus(event.target.value as GoalInitiativeSurfaceStatus)
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
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleCreateInitiative()}
                  disabled={isCreatingInitiative}
                  className="h-8 px-3 bg-primary hover:bg-primary/90 border border-primary rounded-sm text-[12px] font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  {editingInitiativeId === initiative.id ? (
                    <div className="space-y-3">
                      <input
                        value={editInitiativeTitle}
                        onChange={(event) => setEditInitiativeTitle(event.target.value)}
                        className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
                        placeholder="Initiative title"
                        autoFocus
                      />
                      <select
                        value={editInitiativeStatus}
                        onChange={(event) =>
                          setEditInitiativeStatus(event.target.value as GoalInitiativeSurfaceStatus)
                        }
                        className="w-full bg-transparent border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
                      >
                        {initiativeStatusOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-neutral-surface text-slate-200">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingInitiativeId(null)}
                          className="h-7 px-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-neutral-border rounded-sm text-[11px] font-medium text-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!editInitiativeTitle.trim()) return;
                            void onUpdateInitiative(initiative.id, {
                              title: editInitiativeTitle.trim(),
                              description: initiative.description ?? null,
                              status: editInitiativeStatus,
                              ownerId: initiative.owner?.id ?? null,
                              startDate: initiative.startDate ?? null,
                              targetDate: initiative.targetDate ?? null,
                              progressPercent: initiative.progress,
                            }).then(() => setEditingInitiativeId(null));
                          }}
                          disabled={isUpdatingInitiative || !editInitiativeTitle.trim()}
                          className="h-7 px-2.5 bg-primary hover:bg-primary/90 border border-primary rounded-sm text-[11px] font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {isUpdatingInitiative ? <Loader2 className="size-3 animate-spin" /> : null}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : deletingInitiativeId === initiative.id ? (
                    <div className="space-y-3">
                      <p className="text-[12px] text-slate-300">
                        Delete <span className="font-semibold text-slate-100">{initiative.title}</span>? This cannot be undone.
                      </p>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDeletingInitiativeId(null)}
                          className="h-7 px-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-neutral-border rounded-sm text-[11px] font-medium text-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void onDeleteInitiative(initiative.id).then(() => setDeletingInitiativeId(null));
                          }}
                          disabled={isDeletingInitiative}
                          className="h-7 px-2.5 bg-rose-600 hover:bg-rose-500 rounded-sm text-[11px] font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {isDeletingInitiative ? <Loader2 className="size-3 animate-spin" /> : null}
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-slate-200">{initiative.title}</div>
                          {initiative.description ? <p className="text-[12px] text-slate-500">{initiative.description}</p> : null}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingInitiativeId(initiative.id);
                              setEditInitiativeTitle(initiative.title);
                              setEditInitiativeStatus(initiative.status);
                            }}
                            className="p-1 rounded-sm text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors"
                            title="Edit initiative"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingInitiativeId(initiative.id)}
                            className="p-1 rounded-sm text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete initiative"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded-sm border text-[10px] font-medium uppercase tracking-wider ml-1",
                              getInitiativeStatusColor(initiative.status),
                            )}
                          >
                            {formatGoalStatus(initiative.status)}
                          </span>
                        </div>
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
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[13px] text-slate-500">No initiatives yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-border bg-neutral-surface/50 flex items-center gap-2 shrink-0">
        <button
          onClick={() => void handleDelete()}
          disabled={isDeleting}
          className="h-9 px-3 rounded-sm text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Delete
        </button>
        <button
          onClick={() => {
            setStatus("Completed");
            setProgress(100);
          }}
          className="h-9 px-3 rounded-sm text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
        >
          <CheckCircle2 className="size-4" />
          Mark Complete
        </button>
        <button
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="flex-1 h-9 rounded-sm text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save Changes
        </button>
      </div>
    </motion.div>
  );
}
