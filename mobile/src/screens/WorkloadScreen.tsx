import { useMemo } from 'react';
import { AlertCircle, Loader2, Users } from 'lucide-react';
import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, MetricRow, EmptyState } from '../ui';
import { useWorkload } from '../hooks/use-data';

function loadTone(load: number) {
  if (load >= 85) return { bar: 'bg-red-500', chip: 'text-red-500' };
  if (load >= 65) return { bar: 'bg-orange-500', chip: 'text-orange-500' };
  return { bar: 'bg-emerald-500', chip: 'text-emerald-500' };
}

export function WorkloadScreen() {
  const workload = useWorkload();
  const members = workload.data?.members ?? [];

  const stats = useMemo(() => {
    if (members.length === 0) return { avg: 0, overloaded: 0 };
    const loads = members.map((m) => {
      const total = m.assignedTasks || 0;
      return total === 0 ? 0 : Math.min(100, Math.round(((total - m.completedTasks) / Math.max(total, 1)) * 100 + (total >= 10 ? 40 : total * 4)));
    });
    const avg = Math.round(loads.reduce((s, l) => s + l, 0) / loads.length);
    const overloaded = loads.filter((l) => l >= 85).length;
    return { avg, overloaded };
  }, [members]);

  return (
    <ScreenContainer>
      <section className="border-b border-[#1A1A1A]">
        <MetricRow title="Team Load" value={`${stats.avg}%`} />
        <MetricRow title="Overloaded" value={stats.overloaded} />
        <MetricRow title="Active Members" value={members.length} borderBottom={false} />
      </section>

      <section className="mt-2">
        <SectionHeader title="Workload by Member" />
        {workload.isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /></div>
        ) : workload.isError ? (
          <EmptyState icon={AlertCircle} title="Could not load workload" description={workload.error instanceof Error ? workload.error.message : 'Try again later.'} />
        ) : members.length === 0 ? (
          <EmptyState icon={Users} title="No team members" />
        ) : (
          <div className="divide-y divide-[#1A1A1A]">
            {members.map((p) => {
              const total = p.assignedTasks || 0;
              const load = total === 0 ? 0 : Math.min(100, Math.round(((total - p.completedTasks) / Math.max(total, 1)) * 100 + (total >= 10 ? 40 : total * 4)));
              const t = loadTone(load);
              return (
                <div key={p.userId} className="px-4 py-3 hover:bg-[#141414] transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="min-w-0">
                      <p className="text-[13px] text-slate-200 truncate">{p.fullName}</p>
                      <p className="font-mono text-[11px] text-slate-500 uppercase tracking-[0.08em]">
                        {p.assignedTasks} tasks · {p.totalPoints} pts · {p.totalHoursLogged.toFixed(1)}h
                      </p>
                    </div>
                    <span className={`font-mono text-[11px] ${t.chip}`}>{load}%</span>
                  </div>
                  <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div className={`h-full ${t.bar}`} style={{ width: `${load}%` }} />
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
