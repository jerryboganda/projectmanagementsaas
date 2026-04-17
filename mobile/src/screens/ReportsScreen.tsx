import { useMemo } from 'react';
import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, MetricRow, EmptyState } from '../ui';
import { BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import { useVelocity, useWorkload } from '../hooks/use-data';

export function ReportsScreen() {
  const velocity = useVelocity({ sprintCount: 6 });
  const workload = useWorkload();

  const completionRate = useMemo(() => {
    const members = workload.data?.members ?? [];
    if (members.length === 0) return 0;
    const total = members.reduce((s, m) => s + m.assignedTasks, 0);
    const done = members.reduce((s, m) => s + m.completedTasks, 0);
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }, [workload.data]);

  const sprints = velocity.data?.sprints ?? [];
  const maxPts = Math.max(1, ...sprints.map((s) => Math.max(s.plannedPoints ?? 0, s.completedPoints ?? 0)));

  return (
    <ScreenContainer>
      <section className="border-b border-[#1A1A1A]">
        <MetricRow title="Avg Velocity" value={velocity.data ? velocity.data.averageVelocity.toFixed(1) : '—'} />
        <MetricRow title="Completion Rate" value={`${completionRate}%`} />
        <MetricRow title="Completed Sprints" value={sprints.length} borderBottom={false} />
      </section>

      <section className="mt-2">
        <SectionHeader title="Velocity — Last sprints" />
        {velocity.isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /></div>
        ) : velocity.isError ? (
          <EmptyState icon={AlertCircle} title="Could not load velocity" description={velocity.error instanceof Error ? velocity.error.message : 'Try again later.'} />
        ) : sprints.length === 0 ? (
          <EmptyState icon={BarChart3} title="No completed sprints" description="Complete a sprint to see velocity data." />
        ) : (
          <div className="divide-y divide-[#1A1A1A]">
            {sprints.map((s) => {
              const planned = s.plannedPoints ?? 0;
              const completed = s.completedPoints ?? 0;
              const pctPlanned = Math.round((planned / maxPts) * 100);
              const pctDone = Math.round((completed / maxPts) * 100);
              return (
                <div key={s.sprintId} className="px-4 py-3 hover:bg-[#141414] transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] text-slate-200 truncate">{s.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">{completed}/{planned}</span>
                  </div>
                  <div className="relative h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-slate-600/40" style={{ width: `${pctPlanned}%` }} />
                    <div className="absolute inset-y-0 left-0 bg-[#0066FF]" style={{ width: `${pctDone}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </ScreenContainer>
  );
}
