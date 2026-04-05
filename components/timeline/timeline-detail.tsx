"use client";

import { useState } from "react";
import {
  formatTimelineDateRange,
  parseTimelineDate,
  timelineSourceLabel,
  timelineStatusLabel,
  type TimelineItem,
  type TimelineStatus,
  type TimelinePriority,
  type TimelineAssigneeOption,
} from "./data";
import { motion } from "motion/react";
import {
  X,
  CheckSquare,
  User as UserIcon,
  Folder,
  Calendar,
  Briefcase,
  Save,
  Loader2,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineUpdateInput } from "@/hooks/use-timeline-data";

interface Props {
  item: TimelineItem;
  onClose: () => void;
  onSave?: (item: TimelineItem, updates: TimelineUpdateInput) => Promise<void>;
  isSaving?: boolean;
  members?: TimelineAssigneeOption[];
}

const STATUS_OPTIONS: { value: TimelineStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "in-progress", label: "In Progress" },
  { value: "at-risk", label: "At Risk" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS: { value: TimelinePriority; label: string }[] = [
  { value: "None", label: "None" },
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Urgent": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    case "High": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "Medium": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    case "Low": return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    case "None": return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    case "in-progress": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    case "at-risk": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    case "cancelled": return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
};

export function TimelineDetail({ item, onClose, onSave, isSaving, members }: Props) {
  const isTask = item.sourceType === "task";
  const canEdit = !!onSave && (isTask || item.sourceType === "sprint");

  // Form state
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [status, setStatus] = useState<TimelineStatus>(item.status);
  const [priority, setPriority] = useState<TimelinePriority>(item.priority);
  const [startDate, setStartDate] = useState(item.startDate);
  const [endDate, setEndDate] = useState(item.endDate);
  const [assigneeId, setAssigneeId] = useState<string | null>(item.assignee?.id ?? null);
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = () => setIsDirty(true);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isOverdue =
    parseTimelineDate(endDate) < todayStart && status !== "completed";

  const handleSave = async () => {
    if (!onSave) return;
    const updates: TimelineUpdateInput = {};
    if (title !== item.title) updates.title = title;
    if (description !== (item.description ?? "")) updates.description = description || null;
    if (status !== item.status) updates.status = status;
    if (priority !== item.priority) updates.priority = priority;
    if (startDate !== item.startDate) updates.startDate = startDate;
    if (endDate !== item.endDate) updates.endDate = endDate;
    if (assigneeId !== (item.assignee?.id ?? null)) updates.assigneeId = assigneeId;
    await onSave(item, updates);
    setIsDirty(false);
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-2.5 py-1.5 text-[13px] text-slate-200 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-colors placeholder:text-slate-600";
  const selectClass =
    "w-full appearance-none bg-white/[0.03] border border-white/[0.08] rounded-sm px-2.5 py-1.5 text-[13px] text-slate-200 focus:outline-none focus:border-primary/50 transition-colors cursor-pointer";
  const labelClass =
    "text-[11px] text-slate-500 font-medium uppercase tracking-wider block mb-1";

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="w-[400px] border-l border-neutral-border bg-neutral-surface/95 backdrop-blur-xl flex flex-col h-full shadow-2xl z-20"
    >
      {/* Header */}
      <div className="h-14 border-b border-neutral-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[11px] font-mono text-slate-500 px-1.5 py-0.5 bg-white/[0.03] rounded border border-white/[0.05] flex-shrink-0">
            {item.id}
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border text-slate-300 bg-white/[0.04] border-white/[0.08] flex-shrink-0">
            {timelineSourceLabel(item.sourceType)}
          </span>
          {canEdit && (
            <Edit2 className="size-3 text-primary flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {canEdit && isDirty && (
            <button
              onClick={() => { void handleSave(); }}
              disabled={isSaving}
              className={cn(
                "h-7 px-3 flex items-center gap-1.5 rounded-sm text-[12px] font-medium transition-colors",
                "bg-primary hover:bg-primary/90 text-white disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] rounded-sm transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
        {/* Title */}
        <div>
          {canEdit ? (
            <>
              <label className={labelClass}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                className={inputClass}
                placeholder="Task title..."
              />
            </>
          ) : (
            <h2 className="text-xl font-semibold text-slate-100 leading-tight">
              {item.title}
            </h2>
          )}
        </div>

        {/* Description */}
        <div>
          {canEdit ? (
            <>
              <label className={labelClass}>Description</label>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                rows={3}
                className={cn(inputClass, "resize-none")}
                placeholder="Optional description..."
              />
            </>
          ) : item.description ? (
            <p className="text-[13px] text-slate-400 leading-6">
              {item.description}
            </p>
          ) : null}
        </div>

        {/* Status + Priority row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Status</label>
            {canEdit ? (
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as TimelineStatus);
                  markDirty();
                }}
                className={cn(selectClass, getStatusColor(status))}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-background-dark text-slate-200">
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded border inline-block",
                  getStatusColor(item.status),
                )}
              >
                {timelineStatusLabel(item.status)}
              </span>
            )}
          </div>

          <div>
            <label className={labelClass}>Priority</label>
            {canEdit && isTask ? (
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value as TimelinePriority);
                  markDirty();
                }}
                className={cn(selectClass, getPriorityColor(priority))}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-background-dark text-slate-200">
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded border inline-block",
                  getPriorityColor(item.priority),
                )}
              >
                {item.priority}
              </span>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Date</label>
            {canEdit ? (
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); markDirty(); }}
                className={cn(inputClass, "cursor-pointer")}
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <Calendar className={cn("size-3.5", isOverdue ? "text-rose-500" : "text-slate-400")} />
                <span className={cn("text-[13px]", isOverdue ? "text-rose-400 font-medium" : "text-slate-300")}>
                  {formatTimelineDateRange(item.startDate, item.endDate)}
                </span>
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            {canEdit ? (
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); markDirty(); }}
                className={cn(inputClass, "cursor-pointer", isOverdue && "border-rose-500/30")}
              />
            ) : null}
          </div>
        </div>

        {/* Assignee */}
        <div className="space-y-1">
          <span className={labelClass}>Assignee</span>
          {canEdit && isTask ? (
            <select
              value={assigneeId ?? ""}
              onChange={(e) => {
                setAssigneeId(e.target.value || null);
                markDirty();
              }}
              className={selectClass}
            >
              <option value="" className="bg-background-dark text-slate-200">
                Unassigned
              </option>
              {(members ?? []).map((member) => (
                <option key={member.id} value={member.id} className="bg-background-dark text-slate-200">
                  {member.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              {item.assignee ? (
                <>
                  <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium text-primary border border-primary/30">
                    {item.assignee.initials}
                  </div>
                  <span className="text-[13px] text-slate-300">{item.assignee.name}</span>
                </>
              ) : (
                <>
                  <div className="size-6 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/[0.1]">
                    <UserIcon className="size-3 text-slate-500" />
                  </div>
                  <span className="text-[13px] text-slate-500">Unassigned</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Project */}
        <div className="space-y-1">
          <span className={labelClass}>Project</span>
          <div className="flex items-center gap-1.5">
            <Folder className="size-3.5 text-slate-400" />
            <span className="text-[13px] text-slate-300">{item.projectName}</span>
          </div>
        </div>

        {/* Sprint */}
        {item.sprintName && (
          <div className="space-y-1">
            <span className={labelClass}>Sprint</span>
            <div className="flex items-center gap-1.5">
              <Briefcase className="size-3.5 text-slate-400" />
              <span className="text-[13px] text-slate-300">{item.sprintName}</span>
            </div>
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="size-3.5" /> Progress
            </h3>
            <span className="text-[11px] text-slate-400">{item.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>

        {!canEdit && (
          <div className="rounded-sm border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-[12px] text-slate-400 leading-6">
            Editing is only available for task and sprint items.
          </div>
        )}
      </div>
    </motion.div>
  );
}
