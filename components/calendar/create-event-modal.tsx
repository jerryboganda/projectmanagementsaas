"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { CalendarItemType, CalendarProject, CreateCalendarItemInput } from "./data";
import {
  Type,
  CalendarDays,
  FolderOpen,
  AlignLeft,
  Palette,
  Repeat,
  Clock,
  ChevronDown,
} from "lucide-react";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  onCreateItem?: (input: CreateCalendarItemInput) => Promise<void> | void;
  projects?: CalendarProject[];
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

function getLocalISOString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CreateEventModal({
  isOpen,
  onClose,
  onCreate,
  onCreateItem,
  projects,
}: CreateEventModalProps) {
  const projectList = projects ?? [];
  const submitCalendarItem = onCreateItem ?? (async () => undefined);
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarItemType>("Event");
  const [startTime, setStartTime] = useState(getLocalISOString(now));
  const [endTime, setEndTime] = useState(getLocalISOString(oneHourLater));
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("");

  const resetForm = () => {
    const resetNow = new Date();
    const resetLater = new Date(resetNow.getTime() + 60 * 60 * 1000);
    setTitle("");
    setType("Event");
    setStartTime(getLocalISOString(resetNow));
    setEndTime(getLocalISOString(resetLater));
    setDescription("");
    setProjectId("");
    setColor("#3b82f6");
    setIsAllDay(false);
    setRecurrenceRule("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    await submitCalendarItem({
      title: title.trim(),
      type,
      description: description.trim() || undefined,
      color: color || undefined,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      isAllDay,
      recurrenceRule: recurrenceRule.trim() || undefined,
      linkedProjectId: projectId || undefined,
    });

    onCreate();
    handleClose();
  };

  const isValid = title.trim().length > 0 && new Date(endTime).getTime() > new Date(startTime).getTime();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Calendar Item"
      size="lg"
      footer={
        <>
          <button
            onClick={handleClose}
            className="h-8 px-4 bg-white/[0.05] hover:bg-white/[0.1] border border-neutral-border rounded-sm text-[13px] font-medium text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              "h-8 px-4 border border-primary rounded-sm text-[13px] font-medium text-white transition-colors",
              isValid
                ? "bg-primary hover:bg-primary/90"
                : "bg-primary/40 border-primary/40 cursor-not-allowed opacity-60",
            )}
          >
            Create
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>
            <Type className="size-3.5" />
            Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Calendar item title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            autoFocus
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
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-full bg-white/[0.03] border border-neutral-border rounded-sm p-1 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              <CalendarDays className="size-3.5" />
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
              <FolderOpen className="size-3.5" />
              Project
            </label>
            <div className="relative">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={selectClass}
              >
                <option value="" className="bg-background-dark">No project</option>
                {projectList.map((project) => (
                  <option key={project.id} value={project.id} className="bg-background-dark">
                    {project.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <Repeat className="size-3.5" />
              Recurrence
            </label>
            <input
              type="text"
              placeholder="Optional RRULE"
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>
            <AlignLeft className="size-3.5" />
            Description
          </label>
          <textarea
            placeholder="Add a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={cn(inputClass, "resize-none")}
          />
        </div>
      </div>
    </Modal>
  );
}
