'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Download,
  Filter,
  Save,
  Share2,
  RefreshCw,
  Database,
  Check,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReportData, DateRangePreset, DATE_RANGE_OPTIONS } from './data';

interface ReportsToolbarProps {
  activeReport: ReportData | null;
  onExport: (() => Promise<void>) | null;
  dateRange: DateRangePreset;
  onDateRangeChange: (range: DateRangePreset) => void;
}

export function ReportsToolbar({ activeReport, onExport, dateRange, onDateRangeChange }: ReportsToolbarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const shareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (shareTimeoutRef.current) {
        clearTimeout(shareTimeoutRef.current);
      }
    };
  }, []);

  const selectedDateLabel = DATE_RANGE_OPTIONS.find(opt => opt.value === dateRange)?.label ?? 'All time';

  const handleShare = async () => {
    const simulatedUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/reports?id=${activeReport?.id ?? 'project-health'}&range=${dateRange}`;
    try {
      await navigator.clipboard.writeText(simulatedUrl);
    } catch {
      // Fallback: silent fail if clipboard is not available
    }
    setShowShareToast(true);
    if (shareTimeoutRef.current) {
      clearTimeout(shareTimeoutRef.current);
    }
    shareTimeoutRef.current = setTimeout(() => setShowShareToast(false), 2000);
  };

  return (
    <div className="h-16 border-b border-neutral-border/50 bg-background-dark/80 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
          {activeReport?.title || 'Reports'}
        </h1>

        <div className="h-4 w-px bg-neutral-border/50 mx-2"></div>

        <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300">
          <Database className="w-4 h-4" />
          Live workspace data
        </div>

        {/* Date Range Filter */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen(prev => !prev)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors",
              isFilterOpen
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-neutral-surface border-neutral-border text-slate-300 hover:text-slate-100 hover:border-neutral-border/80"
            )}
          >
            <Filter className="w-4 h-4" />
            {selectedDateLabel}
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isFilterOpen && "rotate-180")} />
          </button>

          {isFilterOpen && (
            <div className="absolute top-full left-0 mt-2 w-52 rounded-lg border border-neutral-border bg-neutral-surface shadow-xl z-50">
              <div className="px-3 py-2 border-b border-neutral-border/50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Range</span>
              </div>
              <div className="py-1">
                {DATE_RANGE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onDateRangeChange(option.value);
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 text-sm transition-colors",
                      dateRange === option.value
                        ? "bg-primary/10 text-primary"
                        : "text-slate-300 hover:bg-white/5 hover:text-slate-100"
                    )}
                  >
                    <span>{option.label}</span>
                    {dateRange === option.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center text-xs text-slate-500 mr-2">
          <RefreshCw className="w-3 h-3 mr-1.5" />
          Updated {activeReport?.lastUpdated ? new Date(activeReport.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
        </div>

        <button
          onClick={() => void onExport?.()}
          disabled={!onExport}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors disabled:cursor-not-allowed disabled:text-slate-600"
          title="Export"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Share Button */}
        <div className="relative">
          <button
            onClick={() => void handleShare()}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors"
            title="Copy shareable link"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {showShareToast && (
            <div className="absolute top-full right-0 mt-2 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium whitespace-nowrap z-50">
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                Link copied!
              </div>
            </div>
          )}
        </div>

        <button
          disabled
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary/60 rounded-md text-sm font-medium cursor-not-allowed"
          title="Saved report views are still planned."
        >
          <Save className="w-4 h-4" />
          Saved Views Planned
        </button>
      </div>
    </div>
  );
}
