import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle, Loader2, Inbox } from 'lucide-react';
import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, MetricRow, StatusBadge, IssueRow, EmptyState } from '../ui';
import { useProject, useTasks } from '../hooks/use-data';
import { taskToIssueRow } from '../data/adapters';

export function ProjectDetailScreen() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useProject(projectId);
  const tasks = useTasks({ projectId, pageSize: 100 });

  const rows = useMemo(() => (tasks.data ?? []).map(taskToIssueRow), [tasks.data]);
  const open = rows.filter((r) => r.status === 'open').length;
  const inProgress = rows.filter((r) => r.status === 'in-progress').length;
  const done = rows.filter((r) => r.status === 'done').length;

  const statusLabel = useMemo(() => {
    if (!project.data) return 'On Track';
    const s = project.data.status;
    const text = typeof s === 'number' ? (['Active', 'Paused', 'Completed', 'Archived'][s] ?? 'Active') : s;
    if (text === 'Active') return 'On Track';
    if (text === 'Paused') return 'At Risk';
    if (text === 'Archived') return 'Blocked';
    if (text === 'Completed') return 'Done';
    return String(text);
  }, [project.data]);

  return (
    <ScreenContainer>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="size-7 rounded-[4px] bg-[#111] border border-[#1A1A1A] flex items-center justify-center text-slate-400 hover:text-slate-100"
          aria-label="Back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
            PROJECT · {project.data?.identifier ?? '…'}
          </p>
          <p className="text-[13px] text-slate-100 truncate">
            {project.data?.name ?? (project.isLoading ? 'Loading…' : 'Project')}
          </p>
        </div>
        {project.data ? <StatusBadge status={statusLabel} /> : null}
      </div>

      <section className="border-b border-[#1A1A1A]">
        <MetricRow title="Open" value={open} />
        <MetricRow title="In Progress" value={inProgress} />
        <MetricRow title="Done" value={done} borderBottom={false} />
      </section>

      <section className="mt-2">
        <SectionHeader title="Tasks" />
        {tasks.isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : tasks.isError ? (
          <EmptyState
            icon={AlertCircle}
            title="Could not load tasks"
            description={tasks.error instanceof Error ? tasks.error.message : 'Try again later.'}
          />
        ) : rows.length === 0 ? (
          <EmptyState icon={Inbox} title="No tasks yet" description="Add the first task to this project." />
        ) : (
          <div className="divide-y divide-[#1A1A1A]">
            {rows.map((t) => (
              <IssueRow key={t.id} issue={t} />
            ))}
          </div>
        )}
      </section>
    </ScreenContainer>
  );
}
