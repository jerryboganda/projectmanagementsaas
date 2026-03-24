"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Loader2, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectResponse } from "@/lib/api/contracts";
import type { TimelinePriority } from "./data";
import type { TimelineCreateTaskInput } from "@/hooks/use-timeline-data";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: TimelineCreateTaskInput) => Promise<void>;
  isSubmitting: boolean;
  projects: ProjectResponse[];
  defaultStartDate?: string;
}

const PRIORITY_OPTIONS: { value: TimelinePriority; label: string }[] = [
  { value: "None", label: "None" },
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TimelineCreateModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  projects,
  defaultStartDate,
}: Props) {
  const today = todayKey();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<TimelinePriority>("Medium");
  const [startDate, setStartDate] = useState(defaultStartDate ?? today);
  const [endDate, setEndDate] = useState(addDays(defaultStartDate ?? today, 3));
  const [error, setError] = useState<string | null>(null);

  // Set first project as default once projects load
  useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  // Sync end date when start date changes
  useEffect(() => {
    if (endDate < startDate) {
      setEndDate(addDays(startDate, 3));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setStartDate(defaultStartDate ?? today);
      setEndDate(addDays(defaultStartDate ?? today, 3));
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!projectId) {
      setError("Please select a project.");
      return;
    }
    try {
      await onSubmit({
        projectId,
        title: title.trim(),
        description: description.trim() || null,
        startDate,
        dueDate: endDate,
        priority: priority === "None" ? null : priority,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    }
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-colors placeholder:text-slate-600";
  const labelClass = "text-[11px] text-slate-500 font-medium uppercase tracking-wider block mb-1";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-neutral-surface border border-neutral-border rounded-sm shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-14 border-b border-neutral-border flex items-center justify-between px-5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <h2 className="text-[14px] font-semibold text-slate-200">
                  Create Timeline Task
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] rounded-sm transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { void handleSubmit(e); }} className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className={labelClass}>
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className={inputClass}
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional description..."
                  className={cn(inputClass, "resize-none")}
                />
              </div>

              {/* Project */}
              <div>
                <label className={labelClass}>
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={cn(inputClass, "appearance-none cursor-pointer")}
                >
                  {projects.length === 0 ? (
                    <option value="" className="bg-background-dark">
                      No projects available
                    </option>
                  ) : (
                    projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-background-dark">
                        {p.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className={labelClass}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TimelinePriority)}
                  className={cn(inputClass, "appearance-none cursor-pointer")}
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-background-dark">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={cn(inputClass, "cursor-pointer")}
                  />
                </div>
                <div>
                  <label className={labelClass}>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={cn(inputClass, "cursor-pointer")}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-sm border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">
                  <AlertCircle className="size-3.5 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-4 text-[13px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !projectId}
                  className={cn(
                    "h-8 px-4 flex items-center gap-2 rounded-sm text-[13px] font-medium transition-colors",
                    "bg-primary hover:bg-primary/90 text-white disabled:opacity-60 disabled:cursor-not-allowed",
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
