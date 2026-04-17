import { useMemo, useState } from 'react';
import { Inbox, AlertCircle, Loader2, Bell } from 'lucide-react';
import { ScreenContainer } from './ScreenContainer';
import {
  MetricRow,
  SectionHeader,
  FilterDropdown,
  LinkAction,
  SearchInput,
  IssueRow,
  ActivityItem,
  IssueKey,
  EmptyState,
} from '../ui';
import { useMe, useTasks, useNotifications } from '../hooks/use-data';
import { taskToIssueRow, relativeTime, initialsOf } from '../data/adapters';
import { StaggerList, StaggerItem } from '../motion';

export function HomeScreen() {
  const [search, setSearch] = useState('');
  const me = useMe();
  const tasks = useTasks({ assigneeId: me.data?.id, pageSize: 50 });
  const notifications = useNotifications({ isArchived: false, pageSize: 12 });

  const rows = useMemo(() => (tasks.data ?? []).map(taskToIssueRow), [tasks.data]);
  const triage = useMemo(() => {
    const open = rows.filter((r) => r.status !== 'done');
    const s = search ? open.filter((r) => r.title.toLowerCase().includes(search.toLowerCase())) : open;
    return s.slice(0, 10);
  }, [rows, search]);

  const openCount = rows.filter((r) => r.status === 'open').length;
  const inProgressCount = rows.filter((r) => r.status === 'in-progress').length;
  const completedCount = rows.filter((r) => r.status === 'done').length;

  return (
    <ScreenContainer>
      <section className="border-b border-[#1A1A1A]">
        <MetricRow title="Open Issues" value={openCount} />
        <MetricRow title="In Progress" value={inProgressCount} />
        <MetricRow title="Completed" value={completedCount} borderBottom={false} />
      </section>

      <section className="mt-2">
        <SectionHeader
          title="Personal Triage"
          actions={
            <>
              <FilterDropdown label="Sort" value="Priority" />
              <FilterDropdown label="Status" value="Open" />
              <LinkAction>View All</LinkAction>
            </>
          }
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Filter triage..." />
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
        ) : triage.length === 0 ? (
          <EmptyState icon={Inbox} title="Inbox zero" description="No open issues assigned to you." />
        ) : (
          <StaggerList className="divide-y divide-[#1A1A1A]">
            {triage.map((issue) => (
              <StaggerItem key={issue.id}>
                <IssueRow issue={issue} />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </section>

      <section className="mt-2">
        <SectionHeader title="Recent Activity" actions={<LinkAction>View All</LinkAction>} />
        {notifications.isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : notifications.isError ? (
          <EmptyState icon={AlertCircle} title="Could not load activity" />
        ) : (notifications.data ?? []).length === 0 ? (
          <EmptyState icon={Bell} title="No recent activity" />
        ) : (
          <StaggerList className="divide-y divide-[#1A1A1A]">
            {(notifications.data ?? []).map((n) => (
              <StaggerItem key={n.id}>
                <ActivityItem
                  initials={n.actor ? initialsOf(n.actor.fullName) : '·'}
                  body={
                    <>
                      {n.actor ? (
                        <span className="text-slate-100 font-medium">{n.actor.fullName}</span>
                      ) : (
                        <span className="text-slate-400">System</span>
                      )}{' '}
                      {n.title}
                      {n.entityId && n.entityType === 'Task' ? (
                        <>
                          {' '}
                          <IssueKey>{n.entityId.slice(0, 8)}</IssueKey>
                        </>
                      ) : null}
                    </>
                  }
                  timeAgo={relativeTime(n.createdAt)}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </section>
    </ScreenContainer>
  );
}
