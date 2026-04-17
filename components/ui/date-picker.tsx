'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addDays,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
  startOfDay,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function generateCalendarDays(month: Date) {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days: Date[] = [];
  let current = start;
  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  label,
  error,
  minDate,
  maxDate,
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? startOfMonth(value) : startOfMonth(new Date())
  );
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => startOfDay(new Date()), []);

  const days = useMemo(() => generateCalendarDays(viewMonth), [viewMonth]);

  const isDateDisabled = useCallback(
    (date: Date) => {
      if (minDate && isBefore(date, startOfDay(minDate))) return true;
      if (maxDate && isAfter(date, startOfDay(maxDate))) return true;
      return false;
    },
    [minDate, maxDate]
  );

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // When calendar opens, focus the selected date or today
  const openCalendar = useCallback(() => {
    const initial = value ?? today;
    setFocusedDate(initial);
    setViewMonth(startOfMonth(initial));
    setOpen(true);
  }, [value, today]);

  const toggleCalendar = useCallback(() => {
    if (open) {
      setOpen(false);
    } else {
      openCalendar();
    }
  }, [open, openCalendar]);

  function selectDate(date: Date) {
    if (isDateDisabled(date)) return;
    onChange(date);
    setOpen(false);
  }

  function handleGridKeyDown(e: React.KeyboardEvent) {
    if (!focusedDate) return;

    let next: Date | null = null;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        next = addDays(focusedDate, -1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        next = addDays(focusedDate, 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        next = addDays(focusedDate, -7);
        break;
      case 'ArrowDown':
        e.preventDefault();
        next = addDays(focusedDate, 7);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectDate(focusedDate);
        return;
      default:
        return;
    }

    if (next) {
      setFocusedDate(next);
      if (!isSameMonth(next, viewMonth)) {
        setViewMonth(startOfMonth(next));
      }
    }
  }

  const displayValue = value ? format(value, 'MMM d, yyyy') : '';

  return (
    <div ref={containerRef} className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-xs font-medium text-[#a1a1a1]">{label}</label>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggleCalendar}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-lg border bg-transparent px-3 text-sm text-white transition-colors',
          'focus:outline-none focus:border-[#1313ec] focus:ring-1 focus:ring-[#1313ec]/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-500'
            : 'border-[#222222] hover:border-[#333333]'
        )}
      >
        <Calendar className="h-4 w-4 text-[#666666]" aria-hidden="true" />
        <span className={cn(!value && 'text-[#666666]')}>
          {displayValue || placeholder}
        </span>
      </button>

      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}

      {/* Calendar dropdown */}
      {open && (
        <div
          role="dialog"
          aria-label="Date picker"
          className="absolute z-50 mt-1 w-[280px] rounded-lg border border-[#222222] bg-[#111111] p-3 shadow-xl"
          style={{ top: '100%' }}
        >
          {/* Month/year header */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              aria-label="Previous month"
              className="rounded-md p-1 text-[#888888] transition-colors hover:bg-[#1a1a1a] hover:text-white focus:outline-none focus:ring-1 focus:ring-[#1313ec]/40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-white">
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
              className="rounded-md p-1 text-[#888888] transition-colors hover:bg-[#1a1a1a] hover:text-white focus:outline-none focus:ring-1 focus:ring-[#1313ec]/40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 gap-0">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="flex h-8 items-center justify-center text-xs font-medium text-[#666666]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div
            ref={gridRef}
            role="grid"
            aria-label={format(viewMonth, 'MMMM yyyy')}
            tabIndex={0}
            onKeyDown={handleGridKeyDown}
            className="grid grid-cols-7 gap-0 focus:outline-none"
          >
            {days.map((day) => {
              const isCurrentMonth = isSameMonth(day, viewMonth);
              const isSelected = value ? isSameDay(day, value) : false;
              const isToday = isSameDay(day, today);
              const isFocused = focusedDate ? isSameDay(day, focusedDate) : false;
              const isDayDisabled = isDateDisabled(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isDayDisabled}
                  onClick={() => selectDate(day)}
                  tabIndex={-1}
                  aria-pressed={isSelected}
                  aria-label={format(day, 'EEEE, MMMM d, yyyy')}
                  className={cn(
                    'flex h-8 w-full items-center justify-center rounded-md text-xs transition-colors',
                    'focus:outline-none',
                    !isCurrentMonth && 'text-[#444444]',
                    isCurrentMonth && !isSelected && !isDayDisabled && 'text-[#cccccc] hover:bg-[#1a1a1a]',
                    isSelected && 'bg-[#1313ec] text-white font-medium',
                    isToday && !isSelected && 'ring-1 ring-[#1313ec]/50',
                    isFocused && !isSelected && 'bg-[#1a1a1a]',
                    isDayDisabled && 'text-[#333333] cursor-not-allowed'
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
