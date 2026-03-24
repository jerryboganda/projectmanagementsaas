"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  AlignLeft,
  ChevronDown,
  Trash2,
  Palette,
  Repeat,
  FolderOpen,
  Type,
} from "lucide-react";
import type { CalendarItem, CalendarItemType, CalendarProject, UpdateCalendarItemInput } from "./data";
import { cn } from "@/lib/utils";

interface Props {
  item: CalendarItem;
  projects: CalendarProject[];
  onClose: () => void;
  onSave: (id: string, updates: UpdateCalendarItemInput) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

const typeOptions: { value: CalendarItemType; label: string }[] = [
  { value: "Event", label: "Event" },
  { value: "Meeting", label: "Meeting" },
  { value: "Milestone", label: "Milestone" },
  { value: "Deadline", label: "Deadline" },
  { value: "Reminder", label: "Reminder" },
];

const inputClass =
  "w-full bg-white/[0.03] border border-neutral-border px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] placeholder:text-slate-600 rounded-sm transition-colors";

const selectClass =
  "w-full appearance-none bg-white/[0.03] border border-neutral-border px-3 py-2 text-[13px] text-slate-300 focus:outline-none focus:border-primary/50 rounded-sm transition-colors cursor-pointer";

const labelClass = "flex items-center gap-1.5 text-[12px] font-medium text-slate-400 mb-1.5";

function toLocalDateTimeValue(dateString: string) {
  const date = new Date(dateString);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeColor(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function CalendarDetail({ item, projects, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(item.title);
  const [type, setType] = useState<CalendarItemType>(item.type);
  const [description, setDescription] = useState(item.description ?? "");
  const [color, setColor] = useState(item.color ?? "");
  const [startTime, setStartTime] = useState(toLocalDateTimeValue(item.startTime));
  const [endTime, setEndTime] = useState(toLocalDateTimeValue(item.endTime));
  const [isAllDay, setIsAllDay] = useState(item.isAllDay);
  const [recurrenceRule, setRecurrenceRule] = useState(item.recurrenceRule ?? "");
  const [linkedProjectId, setLinkedProjectId] = useState(item.linkedProjectId ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const project = useMemo(
    () => projects.find((candidate) => candidate.id === linkedProjectId),
    [projects, linkedProjectId],
  );
  const creatorLabel = item.creator?.fullName;

  const isValid = title.trim().length > 0 && new Date(endTime).getTime() > new Date(startTime).getTime();

  const handleSave = () => {
    if (!isValid) {
      return;
    }

    onSave(item.id, {
      title: title.trim(),
      type,
      description: description.trim() || undefined,
      color: normalizeColor(color),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      isAllDay,
      recurrenceRule: recurrenceRule.trim() || undefined,
      linkedProjectId: linkedProjectId || undefined,
    });
  };

  const handleDelete = async () => {
    await onDelete(item.id);
    onClose();
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 bottom-0 w-[400px] bg-neutral-surface/95 backdrop-blur-xl border-l border-neutral-border shadow-2xl flex flex-col z-50"
    >
      <div className="h-14 border-b border-neutral-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Calendar Item
          </span>
          {creatorLabel && (
            <span className="text-[11px] text-slate-500 truncate">
              by {creatorLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/[0.05] rounded-sm transition-colors"
            aria-label="Delete item"
          >
            <Trash2 className="size-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded-sm transition-colors"
            aria-label="Close details"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              <Type className="size-3.5" />
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                <ChevronDown className="size-3.5" />
                Type
              </label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CalendarItemType)}
                  className={selectClass}
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-background-dark">
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="size-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                <Palette className="size-3.5" />
                Color
              </label>
              <input
                type="color"
                value={color || "#3b82f6"}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full bg-white/[0.03] border border-neutral-border rounded-sm p-1 cursor-pointer"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-[13px] text-slate-300">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="size-4 accent-primary"
            />
            All day
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                <CalendarIcon className="size-3.5" />
                Start
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={cn(inputClass, "[color-scheme:dark]")}
              />
            </div>
            <div>
              <label className={labelClass}>
                <Clock className="size-3.5" />
                End
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={cn(inputClass, "[color-scheme:dark]")}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <FolderOpen className="size-3.5" />
              Project
            </label>
            <div className="relative">
              <select
                value={linkedProjectId}
                onChange={(e) => setLinkedProjectId(e.target.value)}
                className={selectClass}
              >
                <option value="" className="bg-background-dark">No project</option>
                {projects.map((projectOption) => (
                  <option key={projectOption.id} value={projectOption.id} className="bg-background-dark">
                    {projectOption.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <Repeat className="size-3.5" />
              Recurrence rule
            </label>
            <input
              type="text"
              placeholder="Optional RRULE value"
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <AlignLeft className="size-3.5" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={cn(inputClass, "resize-none")}
            />
          </div>

          {project && (
            <div className="rounded-md border border-neutral-border bg-white/[0.02] p-3 text-[12px] text-slate-400">
              Linked to <span className="text-slate-200">{project.name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-neutral-border bg-neutral-surface/50 flex items-center gap-3 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 h-9 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-[13px] font-medium rounded-sm border border-neutral-border transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={cn(
            "flex-1 h-9 text-[13px] font-medium rounded-sm transition-colors",
            isValid
              ? "bg-primary hover:bg-primary/90 text-white"
              : "bg-primary/40 text-white/70 cursor-not-allowed",
          )}
        >
          Save changes
        </button>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-surface border border-neutral-border rounded-lg p-6 w-full max-w-[300px] space-y-4"
            >
              <h3 className="text-[15px] font-semibold text-slate-100">Delete this item?</h3>
              <p className="text-[13px] text-slate-400">
                This action cannot be undone. The calendar item &ldquo;{item.title}&rdquo; will be permanently removed.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-9 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-[13px] font-medium rounded-sm border border-neutral-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 h-9 bg-rose-500 hover:bg-rose-600 text-white text-[13px] font-medium rounded-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
