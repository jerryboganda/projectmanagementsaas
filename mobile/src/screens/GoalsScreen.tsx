import { useMemo } from 'react';
import { AlertCircle, Loader2, Target } from 'lucide-react';
import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, MetricRow, Chip, EmptyState } from '../ui';
import { useGoals } from '../hooks/use-data';

function statusText(s: string | number): 'On Track' | 'At Risk' | 'Off Track' | 'Completed' | 'Cancelled' {
  if (typeof s === 'number') {
    return (['On Track', 'At Risk', 'Off Track', 'Completed', 'Cancelled'][s] as 'On Track') ?? 'On Track';
  }
  if (s === 'OnTrack') return 'On Track';
  if (s === 'AtRisk') return 'At Risk';
  if (s === 'OffTrack') return 'Off Track';
  return (s as 'Completed' | 'Cancelled') ?? 'On Track';
}

export function GoalsScreen() {
  const goals = useGoals({ pageSize: 50 });
  const items = goals.data ?? [];

  const stats = useMemo(() => {
    const onTrack = items.filter((g) => statusText(g.status) === 'On Track').length;
    const atRisk = items.filter((g) => statusText(g.status) === 'At Risk').length;
    const avg = items.length ? Math.round(items.reduce((s, g) => s + g.progressPercent, 0) / items.length) : 0;
    return { onTrack, atRisk, avg };
  }, [items]);

  return (
    <ScreenContainer>
      <section className="border-b border-[#1A1A1A]">
        <MetricRow title="On Track" value={stats.onTrack} />
        <MetricRow title="At Risk" value={stats.atRisk} />
        <MetricRow title="Avg Progress" value={`${stats.avg}%`} borderBottom={false} />
      </section>

      <section className="mt-2">
        <SectionHeader title="Goals" />
        {goals.isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /></div>
        ) : goals.isError ? (
          <EmptyState icon={AlertCircle} title="Could not load goals" description={goals.error instanceof Error ? goals.error.message : 'Try again later.'} />
        ) : items.length === 0 ? (
          <EmptyState icon={Target} title="No goals yet" description="Create a goal to track outcomes." />
        ) : (
          <div className="divide-y divide-[#1A1A1A]">
            {items.map((g) => {
              const st = statusText(g.status);
              const tone = st === 'On Track' ? 'emerald' : st === 'At Risk' ? 'orange' : st === 'Off Track' ? 'red' : 'slate';
              const barClass = tone === 'emerald' ? 'bg-emerald-500' : tone === 'orange' ? 'bg-orange-500' : tone === 'red' ? 'bg-red-500' : 'bg-slate-500';
              return (
                <div key={g.id} className="px-4 py-4 hover:bg-[#141414] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Chip tone={tone}>{st}</Chip>
                    {g.owner ? (
                      <span className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.1em]">{g.owner.fullName}</span>
                    ) : null}
                  </div>
                  <p className="text-[13px] text-slate-200">{g.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div className={`h-full ${barClass}`} style={{ width: `${Math.max(0, Math.min(100, g.progressPercent))}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{Math.round(g.progressPercent)}%</span>
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
