import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folders, AlertCircle, Loader2 } from 'lucide-react';
import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, MetricRow, Chip, StatusBadge, EmptyState } from '../ui';
import { useProjects } from '../hooks/use-data';
import { projectToCard } from '../data/adapters';

export function ProjectsScreen() {
  const navigate = useNavigate();
  const projects = useProjects({ pageSize: 50 });

  const cards = useMemo(() => (projects.data ?? []).map(projectToCard), [projects.data]);

  const onTrack = cards.filter((p) => p.status === 'On Track').length;
  const atRisk = cards.filter((p) => p.status === 'At Risk' || p.status === 'Blocked').length;
  const avg = cards.length === 0 ? 0 : Math.round(cards.reduce((s, p) => s + p.progress, 0) / cards.length);

  return (
    <ScreenContainer>
      <section className="border-b border-[#1A1A1A]">
        <MetricRow title="On Track" value={onTrack} />
        <MetricRow title="At Risk" value={atRisk} trendDir={atRisk > 0 ? 'down' : undefined} />
        <MetricRow title="Avg Progress" value={`${avg}%`} borderBottom={false} />
      </section>

      <section className="mt-2">
        <SectionHeader title="Active Projects" />

        {projects.isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : projects.isError ? (
          <EmptyState
            icon={AlertCircle}
            title="Could not load projects"
            description={projects.error instanceof Error ? projects.error.message : 'Try again later.'}
          />
        ) : cards.length === 0 ? (
          <EmptyState
            icon={Folders}
            title="No projects yet"
            description="Create your first project to get started."
          />
        ) : (
          <div className="divide-y divide-[#1A1A1A]">
            {cards.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/projects/${p.id}`)}
                className="w-full flex flex-col gap-1 px-4 py-4 hover:bg-[#141414] text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Chip tone="blue">{p.key}</Chip>
                  <StatusBadge status={p.status} />
                  <span className="font-mono text-[10px] text-slate-500 ml-auto">{p.due}</span>
                </div>
                <p className="text-[13px] text-slate-200">{p.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0066FF]" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{p.progress}%</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </ScreenContainer>
  );
}
