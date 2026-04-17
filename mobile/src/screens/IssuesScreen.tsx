import { useMemo, useState } from 'react';
import { Inbox, AlertCircle, Loader2 } from 'lucide-react';
import { ScreenContainer } from './ScreenContainer';
import {
  SectionHeader,
  MetricRow,
  FilterDropdown,
  LinkAction,
  SearchInput,
  IssueRow,
  EmptyState,
} from '../ui';
import { useTasks, useMe } from '../hooks/use-data';
import { taskToIssueRow } from '../data/adapters';
import { StaggerList, StaggerItem } from '../motion';

export function IssuesScreen() {
  const [search, setSearch] = useState('');
  const me = useMe();
  const tasks = useTasks({ assigneeId: me.data?.id, pageSize: 50 });

  const rows = useMemo(() => (tasks.data ?? []).map(taskToIssueRow), [tasks.data]);
  const filtered = useMemo(
    () =>
      search ? rows.filter((i) => i.title.toLowerCase().includes(search.toLowerCase())) : rows,
    [rows, search],
  );

  const assignedCount = rows.length;
  const overdueCount = useMemo(() => rows.filter((r) => r.overdueLabel).length, [rows]);
  const closedCount = useMemo(
    () =>
      (tasks.data ?? []).filter((t) => {
        if (!t.completedAt) return false;
        return Date.now() - new Date(t.completedAt).getTime() < 7 * 86_400_000;
      }).length,
    [tasks.data],
  );

  return (
    <ScreenContainer>
      <section className="border-b border-[#1A1A1A]">
        <MetricRow title="Assigned" value={assignedCount} />
        <MetricRow title="Overdue" value={overdueCount} trendDir={overdueCount > 0 ? 'down' : undefined} />
        <MetricRow title="Closed 7d" value={closedCount} trendDir={closedCount > 0 ? 'up' : undefined} borderBottom={false} />
      </section>

      <section className="mt-2">
        <SectionHeader
          title="My Issues"
          actions={
            <>
              <FilterDropdown label="Sort" value="Updated" />
              <FilterDropdown label="Priority" value="All" />
              <LinkAction>Filter</LinkAction>
            </>
          }
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Search issues..." />

        {tasks.isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : tasks.isError ? (
          <EmptyState
            icon={AlertCircle}
            title="Could not load issues"
            description={tasks.error instanceof Error ? tasks.error.message : 'Try again later.'}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={search ? 'No matches' : 'No issues assigned'}
            description={search ? 'Try a different search term.' : 'You are all caught up.'}
          />
        ) : (
          <StaggerList className="divide-y divide-[#1A1A1A]">
            {filtered.map((i) => (
              <StaggerItem key={i.id}>
                <IssueRow issue={i} />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </section>
    </ScreenContainer>
  );
}
