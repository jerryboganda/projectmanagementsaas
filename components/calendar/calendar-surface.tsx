"use client";

import { useMemo } from "react";
import type { CalendarItem, CalendarItemType, CalendarProject } from "./data";
import { ViewMode } from "./calendar-layout";
import { motion } from "motion/react";
import { Bell, ChevronRight, Clock, AlertCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  items: CalendarItem[];
  currentDate: Date;
  viewMode: ViewMode;
  selectedItemId: string | null;
  onItemSelect: (id: string | null) => void;
  onSlotClick?: (date: Date, hour: number) => void;
  projects: CalendarProject[];
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TYPE_ACCENTS: Record<CalendarItemType, string> = {
  Event: "#38bdf8",
  Meeting: "#a78bfa",
  Milestone: "#f59e0b",
  Deadline: "#fb7185",
  Reminder: "#94a3b8",
};

const TYPE_BADGES: Record<CalendarItemType, string> = {
  Event: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  Meeting: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  Milestone: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Deadline: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  Reminder: "border-slate-500/30 bg-slate-500/10 text-slate-300",
};

function formatClock(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatTimeRange(item: CalendarItem) {
  if (item.isAllDay) {
    return "All day";
  }

  return `${formatClock(new Date(item.startTime))} - ${formatClock(new Date(item.endTime))}`;
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getTypeIcon(type: CalendarItemType) {
  switch (type) {
    case "Event":
      return <Clock className="size-2.5 shrink-0 opacity-80" />;
    case "Meeting":
      return <Users className="size-2.5 shrink-0 opacity-80" />;
    case "Milestone":
      return <ChevronRight className="size-2.5 shrink-0 opacity-80" />;
    case "Deadline":
      return <AlertCircle className="size-2.5 shrink-0 opacity-80" />;
    case "Reminder":
      return <Bell className="size-2.5 shrink-0 opacity-80" />;
    default:
      return <Clock className="size-2.5 shrink-0 opacity-80" />;
  }
}

// ─── Overlap stacking helpers ──────────────────────────────────────────────

interface OverlapInfo {
  column: number;
  totalColumns: number;
}

/**
 * Computes side-by-side column assignments for overlapping calendar events.
 * Uses greedy column assignment followed by union-find to discover connected
 * overlap groups, then resolves the total column count for each group.
 */
function computeOverlapLayout(
  items: { id: string; startHour: number; endHour: number }[],
): Map<string, OverlapInfo> {
  if (items.length === 0) return new Map();

  const sorted = [...items].sort(
    (a, b) =>
      a.startHour - b.startHour ||
      (b.endHour - b.startHour) - (a.endHour - a.startHour),
  );

  // Greedy column assignment: place each event in the first column whose
  // previous occupant has already ended.
  const columnEnds: number[] = [];
  const columnAssignment = new Map<string, number>();

  for (const ev of sorted) {
    let col = columnEnds.findIndex((end) => end <= ev.startHour);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(ev.endHour);
    } else {
      columnEnds[col] = ev.endHour;
    }
    columnAssignment.set(ev.id, col);
  }

  // Union-find to discover connected overlap groups
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    if (!parent.has(id)) parent.set(id, id);
    if (parent.get(id) !== id) parent.set(id, find(parent.get(id)!));
    return parent.get(id)!;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].startHour >= sorted[i].endHour) break;
      union(sorted[i].id, sorted[j].id);
    }
  }

  // Group by connected component and resolve total columns per group
  const groups = new Map<string, string[]>();
  for (const ev of sorted) {
    const root = find(ev.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(ev.id);
  }

  const result = new Map<string, OverlapInfo>();
  for (const members of groups.values()) {
    const maxCol = Math.max(
      ...members.map((id) => columnAssignment.get(id) ?? 0),
    );
    const totalColumns = maxCol + 1;
    for (const id of members) {
      result.set(id, {
        column: columnAssignment.get(id) ?? 0,
        totalColumns,
      });
    }
  }

  return result;
}

/** Compute the fractional start/end hours for an item relative to a given day. */
function getItemHourRange(
  item: CalendarItem,
  dayTimestamp: number,
): { startHour: number; endHour: number } {
  const start = new Date(item.startTime);
  const end = new Date(item.endTime);
  let startHour = start.getHours() + start.getMinutes() / 60;
  let endHour = end.getHours() + end.getMinutes() / 60;

  if (end.getDate() !== start.getDate() || end.getMonth() !== start.getMonth()) {
    endHour = 24;
  }
  if (start.getTime() < dayTimestamp) {
    startHour = 0;
  }
  if (endHour <= startHour) {
    endHour = startHour + 0.5;
  }

  return { startHour, endHour };
}

// ─── Component ─────────────────────────────────────────────────────────────

export function CalendarSurface({
  items,
  currentDate,
  viewMode,
  selectedItemId,
  onItemSelect,
  onSlotClick,
  projects,
}: Props) {
  const resolveProjectName = (item: CalendarItem) =>
    projects.find((project) => project.id === item.linkedProjectId)?.name;

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  const getItemsForDate = (date: Date) => {
    return items
      .filter((item) => {
        const start = new Date(item.startTime);
        const end = new Date(item.endTime);
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
        const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

        return d >= s && d <= e;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // ─── Month view ────────────────────────────────────────────────────────

  const renderMonthView = () => (
    <div className="flex-1 flex flex-col h-full bg-background-dark">
      <div className="grid grid-cols-7 border-b border-neutral-border bg-neutral-surface/30">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider border-r border-neutral-border last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
        {monthDays.map((dayObj, index) => {
          const dayItems = getItemsForDate(dayObj.date);
          const today = isToday(dayObj.date);

          return (
            <div
              key={index}
              className={cn(
                "border-r border-b border-neutral-border/50 p-1 flex flex-col gap-1 overflow-hidden transition-colors hover:bg-white/[0.01]",
                !dayObj.isCurrentMonth && "bg-neutral-surface/20 opacity-50",
                today && "bg-primary/5",
              )}
            >
              <div className="flex items-center justify-between px-1 mb-1">
                <span
                  className={cn(
                    "text-[12px] font-medium flex items-center justify-center size-6 rounded-full",
                    today ? "bg-primary text-white" : "text-slate-400",
                  )}
                >
                  {dayObj.date.getDate()}
                </span>
                {dayItems.length > 0 && (
                  <span className="text-[10px] text-slate-600 font-mono">{dayItems.length}</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-[2px]">
                {dayItems.map((item) => (
                  <CalendarItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItemId === item.id}
                    onClick={() => onItemSelect(item.id)}
                    projectName={resolveProjectName(item)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── Agenda view ───────────────────────────────────────────────────────

  const renderAgendaView = () => {
    const groupedItems = items.reduce<Record<string, { label: string; items: CalendarItem[] }>>((acc, item) => {
      const start = new Date(item.startTime);
      const key = getDateKey(start);
      if (!acc[key]) {
        acc[key] = {
          label: start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
          items: [],
        };
      }
      acc[key].items.push(item);
      return acc;
    }, {} as Record<string, { label: string; items: CalendarItem[] }>);

    const sortedKeys = Object.keys(groupedItems).sort();

    return (
      <div className="flex-1 overflow-y-auto p-6 bg-background-dark">
        <div className="max-w-3xl mx-auto space-y-8">
          {sortedKeys.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-[13px]">No items found for the selected search.</div>
          ) : (
            sortedKeys.map((key) => (
              <div key={key} className="space-y-3">
                <h3 className="text-[14px] font-medium text-slate-300 sticky top-0 bg-background-dark/90 backdrop-blur-sm py-2 z-10 border-b border-neutral-border/50">
                  {groupedItems[key].label}
                </h3>
                <div className="space-y-2">
                  {groupedItems[key].items.map((item) => (
                    <AgendaItemCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItemId === item.id}
                      onClick={() => onItemSelect(item.id)}
                      projectName={resolveProjectName(item)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ─── Week view ─────────────────────────────────────────────────────────

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const hours = Array.from({ length: 24 }).map((_, i) => i);

    return (
      <div className="flex-1 flex flex-col h-full bg-background-dark overflow-hidden">
        <div className="flex border-b border-neutral-border bg-neutral-surface/30 pl-16">
          {weekDays.map((date, i) => {
            const today = isToday(date);
            return (
              <div
                key={i}
                className="flex-1 py-3 text-center border-r border-neutral-border last:border-r-0 flex flex-col items-center gap-1"
              >
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {DAYS_OF_WEEK[date.getDay()]}
                </span>
                <span
                  className={cn(
                    "text-[15px] font-medium size-8 flex items-center justify-center rounded-full",
                    today ? "bg-primary text-white" : "text-slate-200",
                  )}
                >
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto relative no-scrollbar">
          <div className="flex">
            <div className="w-16 shrink-0 border-r border-neutral-border bg-background-dark z-10">
              {hours.map((hour) => (
                <div key={hour} className="h-16 relative">
                  <span className="absolute -top-2.5 right-2 text-[10px] font-medium text-slate-500">
                    {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 flex relative">
              <div className="absolute inset-0 pointer-events-none">
                {hours.map((hour) => (
                  <div key={hour} className="h-16 border-b border-neutral-border/30 w-full" />
                ))}
              </div>

              {weekDays.map((date, dayIdx) => {
                const dayItems = getItemsForDate(date);
                const today = isToday(date);
                const dayTimestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

                // Compute overlap layout for side-by-side stacking
                const itemPositions = dayItems.map((item) => ({
                  id: item.id,
                  ...getItemHourRange(item, dayTimestamp),
                }));
                const overlapLayout = computeOverlapLayout(itemPositions);

                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      "flex-1 border-r border-neutral-border/50 relative min-h-[1536px]",
                      today && "bg-primary/[0.02]",
                    )}
                  >
                    {/* Clickable hour slots for creating events */}
                    {hours.map((hour) => (
                      <div
                        key={`slot-${hour}`}
                        className="absolute left-0 right-0 h-16 cursor-pointer hover:bg-primary/[0.04] transition-colors z-[1]"
                        style={{ top: `${hour * 64}px` }}
                        onClick={() => onSlotClick?.(date, hour)}
                      />
                    ))}

                    {dayItems.map((item) => {
                      const pos = itemPositions.find((p) => p.id === item.id);
                      const overlap = overlapLayout.get(item.id) ?? { column: 0, totalColumns: 1 };

                      const startH = pos?.startHour ?? 0;
                      const endH = pos?.endHour ?? 1;
                      const top = startH * 64;
                      const height = Math.max((endH - startH) * 64, 24);

                      const widthPercent = 100 / overlap.totalColumns;
                      const leftPercent = overlap.column * widthPercent;

                      return (
                        <div
                          key={item.id}
                          className="absolute z-10"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                          }}
                        >
                          <CalendarItemCard
                            item={item}
                            isSelected={selectedItemId === item.id}
                            onClick={() => onItemSelect(item.id)}
                            isAbsolute
                            projectName={resolveProjectName(item)}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Day view ──────────────────────────────────────────────────────────

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    const dayItems = getItemsForDate(currentDate);
    const dayTimestamp = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();

    // Compute overlap layout for side-by-side stacking
    const itemPositions = dayItems.map((item) => ({
      id: item.id,
      ...getItemHourRange(item, dayTimestamp),
    }));
    const overlapLayout = computeOverlapLayout(itemPositions);

    return (
      <div className="flex-1 flex flex-col h-full bg-background-dark overflow-hidden">
        <div className="flex border-b border-neutral-border bg-neutral-surface/30 pl-16 py-3">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {DAYS_OF_WEEK[currentDate.getDay()]}
            </span>
            <span
              className={cn(
                "text-[15px] font-medium size-8 flex items-center justify-center rounded-full",
                isToday(currentDate) ? "bg-primary text-white" : "text-slate-200",
              )}
            >
              {currentDate.getDate()}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative no-scrollbar">
          <div className="flex">
            <div className="w-16 shrink-0 border-r border-neutral-border bg-background-dark z-10">
              {hours.map((hour) => (
                <div key={hour} className="h-20 relative">
                  <span className="absolute -top-2.5 right-2 text-[10px] font-medium text-slate-500">
                    {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 relative min-h-[1920px]">
              <div className="absolute inset-0 pointer-events-none">
                {hours.map((hour) => (
                  <div key={hour} className="h-20 border-b border-neutral-border/30 w-full" />
                ))}
              </div>

              {/* Clickable hour slots for creating events */}
              {hours.map((hour) => (
                <div
                  key={`slot-${hour}`}
                  className="absolute left-0 right-0 h-20 cursor-pointer hover:bg-primary/[0.04] transition-colors z-[1]"
                  style={{ top: `${hour * 80}px` }}
                  onClick={() => onSlotClick?.(currentDate, hour)}
                />
              ))}

              {dayItems.map((item) => {
                const pos = itemPositions.find((p) => p.id === item.id);
                const overlap = overlapLayout.get(item.id) ?? { column: 0, totalColumns: 1 };

                const startH = pos?.startHour ?? 0;
                const endH = pos?.endHour ?? 1;
                const top = startH * 80;
                const height = Math.max((endH - startH) * 80, 32);

                const widthPercent = 100 / overlap.totalColumns;
                const leftPercent = overlap.column * widthPercent;

                return (
                  <div
                    key={item.id}
                    className="absolute z-10"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `calc(${leftPercent}% + 8px)`,
                      width: `calc(${widthPercent}% - 24px)`,
                    }}
                  >
                    <CalendarItemCard
                      item={item}
                      isSelected={selectedItemId === item.id}
                      onClick={() => onItemSelect(item.id)}
                      isAbsolute
                      showDetails
                      projectName={resolveProjectName(item)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {viewMode === "month" && renderMonthView()}
      {viewMode === "agenda" && renderAgendaView()}
      {viewMode === "week" && renderWeekView()}
      {viewMode === "day" && renderDayView()}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function CalendarItemCard({
  item,
  isSelected,
  onClick,
  isAbsolute = false,
  showDetails = false,
  projectName,
}: {
  item: CalendarItem;
  isSelected: boolean;
  onClick: () => void;
  isAbsolute?: boolean;
  showDetails?: boolean;
  projectName?: string;
}) {
  const accentColor = item.color || TYPE_ACCENTS[item.type];

  return (
    <motion.div
      layoutId={`cal-item-${item.id}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "px-1.5 py-1 rounded-[3px] text-[10px] font-medium cursor-pointer border transition-colors flex flex-col gap-1 overflow-hidden border-neutral-border/60 border-l-2",
        isAbsolute ? "h-full w-full" : "truncate items-center flex-row",
        isSelected ? "ring-1 ring-primary ring-offset-1 ring-offset-background-dark" : "hover:brightness-110",
      )}
      style={{ borderLeftColor: accentColor }}
    >
      <div className="flex items-center gap-1.5 truncate w-full">
        {getTypeIcon(item.type)}
        <span className="truncate">{item.title}</span>
      </div>

      {!isAbsolute && (
        <div className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-500">
          {item.type}
        </div>
      )}

      {showDetails && (
        <div className="flex flex-col gap-1 mt-1 opacity-80">
          <span className="text-[9px] font-mono">{formatTimeRange(item)}</span>
          {projectName && (
            <div className="flex items-center gap-1">
              <div className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
              <span className="text-[9px] truncate">{projectName}</span>
            </div>
          )}
          {item.recurrenceRule && (
            <span className="text-[9px] text-slate-500 truncate">Repeats</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function AgendaItemCard({
  item,
  isSelected,
  onClick,
  projectName,
}: {
  item: CalendarItem;
  isSelected: boolean;
  onClick: () => void;
  projectName?: string;
}) {
  const accentColor = item.color || TYPE_ACCENTS[item.type];

  return (
    <motion.div
      layoutId={`cal-agenda-${item.id}`}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-3 rounded-md border transition-colors cursor-pointer group",
        isSelected
          ? "bg-primary/10 border-primary/30"
          : "bg-neutral-surface/30 border-neutral-border hover:bg-neutral-surface/50 hover:border-neutral-border/80",
      )}
      style={{ borderLeftColor: accentColor, borderLeftWidth: 2 }}
    >
      <div className="flex items-center justify-center w-12 flex-col">
        <span className="text-[11px] text-slate-500 font-mono">
          {formatClock(new Date(item.startTime))}
        </span>
        {item.isAllDay && (
          <span className="text-[9px] uppercase tracking-wider text-slate-500">All day</span>
        )}
      </div>

      <div className="flex items-center justify-center">
        {getTypeIcon(item.type)}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-slate-200 truncate group-hover:text-primary transition-colors">
            {item.title}
          </span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border",
              TYPE_BADGES[item.type],
            )}
          >
            {item.type}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {projectName && <span className="text-[11px] text-slate-500 truncate">{projectName}</span>}
          {item.recurrenceRule && (
            <span className="text-[11px] text-slate-400 truncate">Repeats</span>
          )}
        </div>
      </div>

      <ChevronRight
        className={cn(
          "size-4 transition-transform",
          isSelected ? "text-primary translate-x-1" : "text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5",
        )}
      />
    </motion.div>
  );
}
