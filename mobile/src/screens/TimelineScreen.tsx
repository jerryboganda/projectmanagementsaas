import { AlertCircle, Loader2, CalendarRange } from 'lucide-react';
import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, Chip, EmptyState } from '../ui';
import { useProjects } from '../hooks/use-data';
import { formatShortDate } from '../data/adapters';

export function TimelineScreen() {
  const projects = useProjects({ pageSize: 50, sortBy: 'targetDate', sortOrder: 'asc' });
  const rows = (projects.data ?? []).filter((p) => p.startDate || p.targetDate);

  return (
    <ScreenContainer>
      <SectionHeader title="Project Timeline" />
      {projects.isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /></div>
      ) : projects.isError ? (
        <EmptyState icon={AlertCircle} title="Could not load timeline" description={projects.error instanceof Error ? projects.error.message : 'Try again later.'} />
      ) : rows.length === 0 ? (
        <EmptyState icon={CalendarRange} title="No dated projects" description="Projects with start or target dates will appear here." />
      ) : (
        <div className="divide-y divide-[#1A1A1A]">
          {rows.map((r) => {
            const pct = r.taskCount > 0 ? Math.round((r.completedTaskCount / r.taskCount) * 100) : 0;
            const status = typeof r.status === 'number' ? ['Active', 'Paused', 'Completed', 'Archived'][r.status] ?? 'Active' : r.status;
            const tone: 'blue' | 'emerald' | 'orange' | 'slate' =
              status === 'Completed' ? 'emerald' : status === 'Paused' ? 'orange' : status === 'Archived' ? 'slate' : 'blue';
            const barClass = tone === 'emerald' ? 'bg-emerald-500' : tone === 'orange' ? 'bg-orange-500' : tone === 'slate' ? 'bg-slate-500' : 'bg-[#0066FF]';
            return (
              <div key={r.id} className="px-4 py-4 hover:bg-[#141414] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Chip tone={tone}>{String(status).toUpperCase()}</Chip>
                    <span className="text-[13px] text-slate-200 truncate">{r.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{pct}%</span>
                </div>
                <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div className={`h-full ${barClass}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-slate-600 uppercase tracking-[0.08em]">
                  <span>{r.startDate ? formatShortDate(r.startDate) : '—'}</span>
                  <span>{r.targetDate ? formatShortDate(r.targetDate) : '—'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ScreenContainer>
  );
}
