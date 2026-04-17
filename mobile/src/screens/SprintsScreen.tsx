import { useMemo } from 'react';
import { AlertCircle, Loader2, Flag } from 'lucide-react';
import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, MetricRow, Chip, EmptyState } from '../ui';
import { useProjects, useSprintsForProject } from '../hooks/use-data';
import { formatShortDate } from '../data/adapters';

function sprintStatusText(s: string | number): 'Active' | 'Planned' | 'Completed' | 'Cancelled' {
  if (typeof s === 'number') return (['Planned', 'Active', 'Completed', 'Cancelled'][s] as 'Active') ?? 'Planned';
  return (s as 'Active') ?? 'Planned';
}

export function SprintsScreen() {
  const projects = useProjects({ pageSize: 1 });
  const firstProjectId = projects.data?.[0]?.id;
  const sprints = useSprintsForProject(firstProjectId);
  const items = sprints.data ?? [];

  const active = useMemo(() => items.find((s) => sprintStatusText(s.status) === 'Active'), [items]);

  return (
    <ScreenContainer>
      {active ? (
        <section className="border-b border-[#1A1A1A]">
          <MetricRow title="Sprint Points" value={active.plannedPoints ?? 0} />
          <MetricRow title="Completed" value={active.completedPoints ?? 0} />
          <MetricRow title="Remaining" value={(active.plannedPoints ?? 0) - (active.completedPoints ?? 0)} borderBottom={false} />
        </section>
      ) : null}

      <section className="mt-2">
        <SectionHeader title="Sprints" />
        {projects.isLoading || sprints.isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /></div>
        ) : !firstProjectId ? (
          <EmptyState icon={Flag} title="No project" description="Create a project to start sprinting." />
        ) : sprints.isError ? (
          <EmptyState icon={AlertCircle} title="Could not load sprints" description={sprints.error instanceof Error ? sprints.error.message : 'Try again later.'} />
        ) : items.length === 0 ? (
          <EmptyState icon={Flag} title="No sprints yet" description="Plan the first sprint for this project." />
        ) : (
          <div className="divide-y divide-[#1A1A1A]">
            {items.map((s) => {
              const st = sprintStatusText(s.status);
              const planned = s.plannedPoints ?? 0;
              const completed = s.completedPoints ?? 0;
              const pct = planned ? Math.round((completed / planned) * 100) : 0;
              const tone: 'blue' | 'emerald' | 'slate' | 'orange' = st === 'Active' ? 'blue' : st === 'Completed' ? 'emerald' : st === 'Cancelled' ? 'orange' : 'slate';
              return (
                <div key={s.id} className="px-4 py-4 hover:bg-[#141414] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Chip tone={tone}>{st.toUpperCase()}</Chip>
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.1em]">
                      {formatShortDate(s.startDate)} – {formatShortDate(s.endDate)}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-200">{s.name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div className="h-full bg-[#0066FF]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      {completed}/{planned}
                    </span>
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
