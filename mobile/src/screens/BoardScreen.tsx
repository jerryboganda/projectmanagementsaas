import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, LayoutGrid } from 'lucide-react';
import { ScreenContainer } from './ScreenContainer';
import { Chip, IssueRow, EmptyState, type IssueRowData } from '../ui';
import { useProjects, useTasks } from '../hooks/use-data';
import { taskToIssueRow } from '../data/adapters';

const GROUPS: Array<{ id: IssueRowData['status']; name: string; tone: 'slate' | 'blue' | 'emerald' }> = [
  { id: 'open', name: 'TO DO', tone: 'slate' },
  { id: 'in-progress', name: 'IN PROGRESS', tone: 'blue' },
  { id: 'done', name: 'DONE', tone: 'emerald' },
];

export function BoardScreen() {
  const navigate = useNavigate();
  const projects = useProjects({ pageSize: 1 });
  const firstProjectId = projects.data?.[0]?.id;
  const tasks = useTasks({ projectId: firstProjectId, pageSize: 100 });

  const grouped = useMemo(() => {
    const rows = (tasks.data ?? []).map(taskToIssueRow);
    return GROUPS.map((g) => ({ ...g, items: rows.filter((r) => r.status === g.id) }));
  }, [tasks.data]);

  if (projects.isLoading) {
    return (
      <ScreenContainer>
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      </ScreenContainer>
    );
  }

  if (!firstProjectId) {
    return (
      <ScreenContainer>
        <EmptyState
          icon={LayoutGrid}
          title="No project to board"
          description="Create a project to see its tasks on the board."
        />
        <div className="px-4">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="w-full py-3 rounded-[4px] bg-[#0066FF] text-white font-mono text-[11px] uppercase tracking-[0.08em]"
          >
            Go to projects
          </button>
        </div>
      </ScreenContainer>
    );
  }

  if (tasks.isError) {
    return (
      <ScreenContainer>
        <EmptyState
          icon={AlertCircle}
          title="Could not load board"
          description={tasks.error instanceof Error ? tasks.error.message : 'Try again later.'}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {tasks.isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        grouped.map((col) => (
          <section key={col.id} className="border-b border-[#1A1A1A]">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0A0A0A]">
              <div className="flex items-center gap-2">
                <Chip tone={col.tone}>{col.name}</Chip>
                <span className="font-mono text-[10px] text-slate-500">{col.items.length}</span>
              </div>
            </div>
            {col.items.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-600">
                  No items
                </span>
              </div>
            ) : (
              <div className="divide-y divide-[#1A1A1A]">
                {col.items.map((i) => (
                  <IssueRow key={i.id} issue={i} />
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </ScreenContainer>
  );
}
