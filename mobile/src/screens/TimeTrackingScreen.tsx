import { useMemo, useState } from 'react';
import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, MetricRow, Chip, IssueKey, EmptyState } from '../ui';
import { Play, Square, AlertCircle, Loader2, Clock } from 'lucide-react';
import { useMe, useTimeEntries } from '../hooks/use-data';
import { api } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d: Date) { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; }
function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function TimeTrackingScreen() {
  const qc = useQueryClient();
  const me = useMe();
  const today = startOfDay(new Date()).toISOString();
  const weekStart = startOfWeek(new Date()).toISOString();

  const entriesToday = useTimeEntries({ userId: me.data?.id, startedAfter: today });
  const entriesWeek = useTimeEntries({ userId: me.data?.id, startedAfter: weekStart });

  const runningEntry = useMemo(() => (entriesToday.data ?? []).find((e) => !e.endTime), [entriesToday.data]);
  const [busy, setBusy] = useState(false);

  const todayMins = (entriesToday.data ?? []).reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const weekMins = (entriesWeek.data ?? []).reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const billableMins = (entriesWeek.data ?? []).filter((e) => e.isBillable).reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const billablePct = weekMins === 0 ? 0 : Math.round((billableMins / weekMins) * 100);

  const toggle = async () => {
    setBusy(true);
    try {
      if (runningEntry) {
        await api.timeEntries.stop(runningEntry.id);
      } else {
        await api.timeEntries.start({ description: 'Timer started from mobile' });
      }
      await qc.invalidateQueries({ queryKey: ['time-entries'] });
    } catch {
      // swallow — UI stays consistent
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <section className="border-b border-[#1A1A1A]">
        <MetricRow title="Today" value={formatDuration(todayMins)} />
        <MetricRow title="This Week" value={formatDuration(weekMins)} />
        <MetricRow title="Billable" value={`${billablePct}%`} borderBottom={false} />
      </section>

      <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={`flex items-center gap-2 px-3 py-2 rounded-[4px] font-mono text-[11px] uppercase tracking-[0.08em] border transition-colors ${
            runningEntry
              ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
              : 'bg-[#0066FF]/10 text-[#0066FF] border-[#0066FF]/20 hover:bg-[#0066FF]/20'
          } disabled:opacity-50`}
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : runningEntry ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {runningEntry ? 'Stop Timer' : 'Start Timer'}
        </button>
        <span className="font-mono text-[13px] text-slate-300">
          {runningEntry ? formatTime(runningEntry.startTime) : '—'}
        </span>
      </div>

      <SectionHeader title="Today's Entries" />
      {entriesToday.isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /></div>
      ) : entriesToday.isError ? (
        <EmptyState icon={AlertCircle} title="Could not load entries" description={entriesToday.error instanceof Error ? entriesToday.error.message : 'Try again later.'} />
      ) : (entriesToday.data ?? []).length === 0 ? (
        <EmptyState icon={Clock} title="No entries today" description="Start a timer to log time." />
      ) : (
        <div className="divide-y divide-[#1A1A1A]">
          {(entriesToday.data ?? []).map((e) => (
            <div key={e.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#141414] transition-colors">
              <span className="font-mono text-[11px] text-slate-500 w-12">{formatTime(e.startTime)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {e.taskId ? <IssueKey>{e.taskId.slice(0, 6).toUpperCase()}</IssueKey> : null}
                  <span className="text-[13px] text-slate-200 truncate">{e.description ?? 'Untitled entry'}</span>
                </div>
              </div>
              <Chip tone="neutral">{formatDuration(e.durationMinutes)}</Chip>
            </div>
          ))}
        </div>
      )}
    </ScreenContainer>
  );
}
