"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { parseTimelineDate, timelineSourceLabel, type TimelineItem } from "./data";
import { motion } from "motion/react";
import {
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  CheckSquare,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DragState {
  itemId: string;
  type: "move" | "resize-left" | "resize-right";
  startX: number;
  originalLeft: number;
  originalWidth: number;
  currentDeltaPx: number;
}

interface Props {
  items: TimelineItem[];
  zoomLevel: "days" | "weeks" | "months";
  selectedItemId: string | null;
  onItemSelect: (id: string) => void;
  onItemUpdate?: (item: TimelineItem, newStartDate: string, newEndDate: string) => Promise<void>;
  savingItemId?: string | null;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function TimelineSurface({
  items,
  zoomLevel,
  selectedItemId,
  onItemSelect,
  onItemUpdate,
  savingItemId,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowHeight = 44;

  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  // Keep ref in sync with state for pointer event handlers
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // Calculate date range
  const { startDate, endDate, totalDays } = useMemo(() => {
    if (items.length === 0) {
      const today = new Date();
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        totalDays: 30,
      };
    }

    let minDate = parseTimelineDate(items[0].startDate);
    let maxDate = parseTimelineDate(items[0].endDate);

    items.forEach((item) => {
      const start = parseTimelineDate(item.startDate);
      const end = parseTimelineDate(item.endDate);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    });

    minDate = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    maxDate = new Date(maxDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const totalDays = Math.round(
      (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return { startDate: minDate, endDate: maxDate, totalDays };
  }, [items]);

  const dayWidth = zoomLevel === "days" ? 40 : zoomLevel === "weeks" ? 15 : 5;
  const gridWidth = totalDays * dayWidth;

  // Generate date headers
  const dateHeaders = useMemo(() => {
    const headers: {
      date: Date;
      label: string;
      subLabel: string;
      isWeekend: boolean;
      daysInMonth?: number;
    }[] = [];
    let currentDate = new Date(startDate);

    if (zoomLevel === "days") {
      for (let i = 0; i < totalDays; i++) {
        headers.push({
          date: new Date(currentDate),
          label: currentDate.getDate().toString(),
          subLabel: currentDate
            .toLocaleDateString("en-US", { weekday: "short" })
            .charAt(0),
          isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (zoomLevel === "weeks") {
      while (currentDate.getDay() !== 1) {
        currentDate.setDate(currentDate.getDate() - 1);
      }
      const end = new Date(endDate);
      while (currentDate <= end) {
        headers.push({
          date: new Date(currentDate),
          label: `W${Math.ceil(currentDate.getDate() / 7)}`,
          subLabel: currentDate.toLocaleDateString("en-US", { month: "short" }),
          isWeekend: false,
        });
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else {
      currentDate.setDate(1);
      const end = new Date(endDate);
      while (currentDate <= end) {
        const daysInMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
        ).getDate();
        headers.push({
          date: new Date(currentDate),
          label: currentDate.toLocaleDateString("en-US", { month: "short" }),
          subLabel: currentDate.getFullYear().toString(),
          isWeekend: false,
          daysInMonth,
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    return headers;
  }, [startDate, endDate, totalDays, zoomLevel]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "in-progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "at-risk":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "cancelled":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="size-3.5 text-emerald-500" />;
      case "in-progress":
        return <Clock className="size-3.5 text-blue-500" />;
      case "at-risk":
        return <AlertCircle className="size-3.5 text-rose-500" />;
      case "cancelled":
        return <X className="size-3.5 text-slate-500" />;
      default:
        return <div className="size-3.5 rounded-full border-2 border-slate-500" />;
    }
  };

  const calculatePosition = useCallback(
    (itemStart: string, itemEnd: string) => {
      const start = parseTimelineDate(itemStart);
      const end = parseTimelineDate(itemEnd);

      if (end < start) end.setTime(start.getTime());

      const offsetDays = Math.max(
        0,
        (start.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const durationDays = Math.max(
        1,
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1,
      );

      return {
        left: offsetDays * dayWidth,
        width: durationDays * dayWidth,
      };
    },
    [startDate, dayWidth],
  );

  // Convert pixel offset to day delta (snapped to whole days)
  const pxToDays = useCallback(
    (px: number) => Math.round(px / dayWidth),
    [dayWidth],
  );

  // Convert left pixel offset back to a date
  const pxToDate = useCallback(
    (leftPx: number) => {
      const days = leftPx / dayWidth;
      const date = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      return date;
    },
    [startDate, dayWidth],
  );

  // ─── Pointer event handlers ──────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (
      e: React.PointerEvent,
      item: TimelineItem,
      type: DragState["type"],
      currentLeft: number,
      currentWidth: number,
    ) => {
      if (item.sourceType !== "task") return;
      if (!onItemUpdate) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const newDrag: DragState = {
        itemId: item.id,
        type,
        startX: e.clientX,
        originalLeft: currentLeft,
        originalWidth: currentWidth,
        currentDeltaPx: 0,
      };
      setDragState(newDrag);
      dragStateRef.current = newDrag;
    },
    [onItemUpdate],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const delta = e.clientX - ds.startX;
      setDragState((prev) => (prev ? { ...prev, currentDeltaPx: delta } : null));
    },
    [],
  );

  const handlePointerUp = useCallback(
    async (e: React.PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDragState(null);
      dragStateRef.current = null;

      const dayDelta = pxToDays(ds.currentDeltaPx);
      if (dayDelta === 0) return;

      const item = items.find((i) => i.id === ds.itemId);
      if (!item || !onItemUpdate) return;

      const originalStart = parseTimelineDate(item.startDate);
      const originalEnd = parseTimelineDate(item.endDate);

      let newStart = new Date(originalStart);
      let newEnd = new Date(originalEnd);
      const MS_PER_DAY = 24 * 60 * 60 * 1000;

      if (ds.type === "move") {
        newStart = new Date(originalStart.getTime() + dayDelta * MS_PER_DAY);
        newEnd = new Date(originalEnd.getTime() + dayDelta * MS_PER_DAY);
      } else if (ds.type === "resize-right") {
        newEnd = new Date(originalEnd.getTime() + dayDelta * MS_PER_DAY);
        if (newEnd < newStart) newEnd = new Date(newStart);
      } else if (ds.type === "resize-left") {
        newStart = new Date(originalStart.getTime() + dayDelta * MS_PER_DAY);
        if (newStart > newEnd) newStart = new Date(newEnd);
      }

      await onItemUpdate(item, formatDateKey(newStart), formatDateKey(newEnd));
    },
    [items, onItemUpdate, pxToDays],
  );

  // Compute visual position for a dragged item
  const getDraggedPosition = useCallback(
    (item: TimelineItem, basePos: { left: number; width: number }) => {
      if (!dragState || dragState.itemId !== item.id) return basePos;

      const snappedDelta = pxToDays(dragState.currentDeltaPx) * dayWidth;

      if (dragState.type === "move") {
        return { left: basePos.left + snappedDelta, width: basePos.width };
      }
      if (dragState.type === "resize-right") {
        const newWidth = Math.max(dayWidth, basePos.width + snappedDelta);
        return { left: basePos.left, width: newWidth };
      }
      if (dragState.type === "resize-left") {
        const newLeft = basePos.left + snappedDelta;
        const newWidth = Math.max(dayWidth, basePos.width - snappedDelta);
        return { left: newLeft, width: newWidth };
      }
      return basePos;
    },
    [dragState, pxToDays, dayWidth],
  );

  const isDragging = dragState !== null;

  return (
    <div
      className="flex w-full h-full overflow-hidden bg-background-dark relative"
      onPointerMove={isDragging ? handlePointerMove : undefined}
      onPointerUp={isDragging ? (e) => { void handlePointerUp(e); } : undefined}
    >
      {items.length === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background-dark/80 backdrop-blur-sm">
          <div className="size-16 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-4">
            <Clock className="size-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-200 mb-2">
            No timeline items found
          </h3>
          <p className="text-[13px] text-slate-400 max-w-sm text-center">
            Try adjusting your filters or search query to find what you&apos;re
            looking for.
          </p>
        </div>
      )}

      {/* Left Pane: Item List */}
      <div className="w-[320px] flex-shrink-0 border-r border-neutral-border flex flex-col bg-neutral-surface/30 z-10">
        <div className="h-12 border-b border-neutral-border flex items-center px-4 text-[12px] font-medium text-slate-400 uppercase tracking-wider bg-neutral-surface/50">
          <div className="flex-1">Timeline Item</div>
          <div className="w-16 text-right">Status</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemSelect(item.id)}
              className={cn(
                "h-11 border-b border-white/[0.02] flex items-center px-4 cursor-pointer transition-colors",
                selectedItemId === item.id
                  ? "bg-primary/10"
                  : "hover:bg-white/[0.02]",
              )}
            >
              <div className="flex-1 flex items-center gap-2 overflow-hidden min-w-0">
                {item.sourceType === "project" ? (
                  <ChevronDown className="size-3.5 text-slate-500 flex-shrink-0" />
                ) : item.sourceType === "sprint" ? (
                  <Calendar className="size-3.5 text-amber-500 flex-shrink-0" />
                ) : (
                  <CheckSquare className="size-3.5 text-slate-500 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "text-[13px] truncate",
                        item.sourceType === "project"
                          ? "font-medium text-slate-200"
                          : "text-slate-300",
                      )}
                    >
                      {item.title}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/[0.06] text-slate-500 bg-white/[0.03] flex-shrink-0">
                      {timelineSourceLabel(item.sourceType)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {item.projectName}
                    {item.sprintName ? ` · ${item.sprintName}` : ""}
                  </div>
                </div>
              </div>
              <div className="w-16 flex justify-end items-center gap-1.5">
                {savingItemId === item.id && (
                  <Loader2 className="size-3 text-primary animate-spin" />
                )}
                {getStatusIcon(item.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Timeline Grid */}
      <div
        className="flex-1 overflow-auto custom-scrollbar relative"
        ref={containerRef}
      >
        <div
          style={{ width: gridWidth, minWidth: "100%" }}
          className="h-full flex flex-col"
        >
          {/* Timeline Header */}
          <div className="h-12 border-b border-neutral-border flex sticky top-0 bg-neutral-surface/90 backdrop-blur-md z-10">
            {dateHeaders.map((header, i) => (
              <div
                key={i}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center justify-center border-r border-white/[0.02]",
                  header.isWeekend && "bg-white/[0.02]",
                )}
                style={{
                  width:
                    zoomLevel === "days"
                      ? dayWidth
                      : zoomLevel === "weeks"
                        ? dayWidth * 7
                        : dayWidth * (header.daysInMonth || 30),
                }}
              >
                <span className="text-[11px] font-medium text-slate-300">
                  {header.label}
                </span>
                <span className="text-[9px] text-slate-500 uppercase">
                  {header.subLabel}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline Body */}
          <div className="flex-1 relative">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {dateHeaders.map((header, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-shrink-0 border-r border-white/[0.02] h-full",
                    header.isWeekend && "bg-white/[0.01]",
                  )}
                  style={{
                    width:
                      zoomLevel === "days"
                        ? dayWidth
                        : zoomLevel === "weeks"
                          ? dayWidth * 7
                          : dayWidth * (header.daysInMonth || 30),
                  }}
                />
              ))}
            </div>

            {/* Today Indicator */}
            <div
              className="absolute top-0 bottom-0 w-px bg-primary/50 z-0"
              style={{
                left: Math.max(
                  0,
                  ((new Date().getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24)) *
                    dayWidth,
                ),
              }}
            >
              <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
            </div>

            {/* Timeline Items */}
            <div className="relative z-10">
              {items.map((item, index) => {
                const basePos = calculatePosition(item.startDate, item.endDate);
                const pos = getDraggedPosition(item, basePos);
                const isSelected = selectedItemId === item.id;
                const isBeingDragged =
                  dragState?.itemId === item.id && dragState.currentDeltaPx !== 0;
                const isSaving = savingItemId === item.id;
                const isTask = item.sourceType === "task";

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "h-11 border-b border-transparent flex items-center relative group",
                      isSelected ? "bg-primary/5" : "hover:bg-white/[0.01]",
                    )}
                    style={{ top: index * rowHeight }}
                  >
                    {item.sourceType === "sprint" ? (
                      <motion.div
                        className="absolute h-6 w-6 -ml-3 flex items-center justify-center cursor-pointer"
                        style={{ left: pos.left + pos.width / 2 }}
                        whileHover={{ scale: 1.2 }}
                        onClick={() => onItemSelect(item.id)}
                      >
                        <div
                          className={cn(
                            "w-3 h-3 rotate-45",
                            isSelected
                              ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                              : "bg-amber-500",
                          )}
                        />
                      </motion.div>
                    ) : (
                      <div
                        className={cn(
                          "absolute h-6 rounded-sm border overflow-visible flex items-center px-2 select-none",
                          getStatusColor(item.status),
                          isSelected &&
                            "ring-1 ring-primary ring-offset-1 ring-offset-background-dark",
                          isBeingDragged && "opacity-80 ring-1 ring-primary",
                          isSaving && "opacity-60",
                          isTask && !isSaving && onItemUpdate
                            ? isDragging && dragState?.itemId === item.id
                              ? "cursor-grabbing"
                              : "cursor-grab"
                            : "cursor-pointer",
                        )}
                        style={{ left: pos.left, width: pos.width }}
                        onClick={() => {
                          if (!isDragging) onItemSelect(item.id);
                        }}
                        onPointerDown={
                          isTask && onItemUpdate
                            ? (e) =>
                                handlePointerDown(
                                  e,
                                  item,
                                  "move",
                                  basePos.left,
                                  basePos.width,
                                )
                            : undefined
                        }
                      >
                        {/* Left resize handle */}
                        {isTask && onItemUpdate && (
                          <div
                            className={cn(
                              "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white/60 border border-white/30 z-20 opacity-0 group-hover:opacity-100 transition-opacity",
                              isDragging &&
                                dragState?.itemId === item.id &&
                                dragState.type === "resize-left"
                                ? "opacity-100"
                                : "",
                            )}
                            style={{ cursor: "ew-resize" }}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              handlePointerDown(
                                e,
                                item,
                                "resize-left",
                                basePos.left,
                                basePos.width,
                              );
                            }}
                          />
                        )}

                        {/* Progress Fill */}
                        {item.progress > 0 && (
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-white/10 pointer-events-none"
                            style={{ width: `${item.progress}%` }}
                          />
                        )}

                        {/* Label */}
                        <div className="flex items-center gap-1.5 relative z-10 overflow-hidden w-full">
                          {isSaving && (
                            <Loader2 className="size-2.5 text-white/60 animate-spin flex-shrink-0" />
                          )}
                          <span className="text-[11px] font-medium truncate drop-shadow-md flex-1 pointer-events-none">
                            {item.title}
                          </span>
                          {item.assignee && (
                            <div className="flex-shrink-0 size-4 rounded-full bg-background-dark/50 flex items-center justify-center overflow-hidden border border-white/10 pointer-events-none">
                              {item.assignee.avatarUrl ? (
                                <Image
                                  src={item.assignee.avatarUrl}
                                  alt={item.assignee.name}
                                  width={16}
                                  height={16}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[8px] font-medium text-white">
                                  {item.assignee.name.charAt(0)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right resize handle */}
                        {isTask && onItemUpdate && (
                          <div
                            className={cn(
                              "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white/60 border border-white/30 z-20 opacity-0 group-hover:opacity-100 transition-opacity",
                              isDragging &&
                                dragState?.itemId === item.id &&
                                dragState.type === "resize-right"
                                ? "opacity-100"
                                : "",
                            )}
                            style={{ cursor: "ew-resize" }}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              handlePointerDown(
                                e,
                                item,
                                "resize-right",
                                basePos.left,
                                basePos.width,
                              );
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
