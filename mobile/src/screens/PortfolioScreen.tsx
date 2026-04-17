import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Folders } from 'lucide-react';
import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, MetricRow, StatusBadge, Chip, EmptyState } from '../ui';
import { useProjects } from '../hooks/use-data';

function projectStatusLabel(s: string | number): string {
  if (typeof s === 'number') return ['Active', 'Paused', 'Completed', 'Archived'][s] ?? 'Active';
  return s;
}

export function PortfolioScreen() {
  const navigate = useNavigate();
  const projects = useProjects({ pageSize: 100 });
  const items = projects.data ?? [];

  const active = items.filter((p) => projectStatusLabel(p.status) === 'Active').length;
  const totalTasks = items.reduce((s, p) => s + p.taskCount, 0);
  const doneTasks = items.reduce((s, p) => s + p.completedTaskCount, 0);
  const healthPct = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  return (
    <ScreenContainer>
      <section className="border-b border-[#1A1A1A]">
        <MetricRow title="Active Projects" value={active} />
        <MetricRow title="Total Projects" value={items.length} />
        <MetricRow title="Portfolio Health" value={`${healthPct}%`} borderBottom={false} />
      </section>

      <section className="mt-2">
        <SectionHeader title="Projects" />
        {projects.isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /></div>
        ) : projects.isError ? (
          <EmptyState icon={AlertCircle} title="Could not load portfolio" description={projects.error instanceof Error ? projects.error.message : 'Try again later.'} />
        ) : items.length === 0 ? (
          <EmptyState icon={Folders} title="No projects" description="Projects will appear here." />
        ) : (
          <div className="divide-y divide-[#1A1A1A]">
            {items.map((p) => {
              const status = projectStatusLabel(p.status);
              const pct = p.taskCount === 0 ? 0 : Math.round((p.completedTaskCount / p.taskCount) * 100);
              const label = status === 'Active' ? 'On Track' : status === 'Paused' ? 'At Risk' : status === 'Completed' ? 'Done' : status;
              const bar = pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-orange-500' : 'bg-red-500';
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="w-full flex flex-col gap-1 px-4 py-4 hover:bg-[#141414] text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status={label} />
                    <Chip tone="neutral">{p.identifier}</Chip>
                    <Chip tone="neutral">{p.taskCount} tasks</Chip>
                  </div>
                  <p className="text-[13px] text-slate-200">{p.name}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </ScreenContainer>
  );
}
