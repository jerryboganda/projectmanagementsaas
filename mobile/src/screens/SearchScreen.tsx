import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenContainer } from './ScreenContainer';
import { SearchInput, SectionHeader, Chip, EmptyState } from '../ui';
import { Search as SearchIcon, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useSearch } from '../hooks/use-data';

const SCOPES = ['ALL', 'task', 'project', 'document', 'goal'] as const;
type Scope = (typeof SCOPES)[number];
const SCOPE_LABEL: Record<Scope, string> = {
  ALL: 'ALL',
  task: 'TASKS',
  project: 'PROJECTS',
  document: 'DOCS',
  goal: 'GOALS',
};
const RECENT = ['mobile', 'sprint', 'design'];

export function SearchScreen() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<Scope>('ALL');
  const search = useSearch(q);

  const filtered = useMemo(() => {
    const items = search.data ?? [];
    if (scope === 'ALL') return items;
    return items.filter((i) => i.type === scope);
  }, [search.data, scope]);

  const tooShort = q.trim().length > 0 && q.trim().length < 2;

  return (
    <ScreenContainer>
      <SearchInput value={q} onChange={setQ} placeholder="Search issues, projects, docs..." />

      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto border-b border-[#1A1A1A]">
        {SCOPES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`font-mono text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 rounded-[3px] border transition-colors flex-shrink-0 ${
              scope === s
                ? 'bg-[#0066FF]/10 text-[#0066FF] border-[#0066FF]/30'
                : 'bg-[#111] text-slate-400 border-[#1A1A1A] hover:text-slate-200'
            }`}
          >
            {SCOPE_LABEL[s]}
          </button>
        ))}
      </div>

      {!q.trim() ? (
        <section className="mt-2">
          <SectionHeader title="Recent" />
          <div className="divide-y divide-[#1A1A1A]">
            {RECENT.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setQ(r)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#141414] text-left transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="flex-1 text-[13px] text-slate-200 truncate">{r}</span>
                <Chip tone="neutral">Recent</Chip>
              </button>
            ))}
          </div>
        </section>
      ) : tooShort ? (
        <EmptyState icon={SearchIcon} title="Keep typing" description="Enter at least 2 characters." />
      ) : search.isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : search.isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Search failed"
          description={search.error instanceof Error ? search.error.message : 'Try again later.'}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={SearchIcon} title="No matches" description={`No results for "${q}"`} />
      ) : (
        <section className="mt-2">
          <SectionHeader title={`${filtered.length} Results`} />
          <div className="divide-y divide-[#1A1A1A]">
            {filtered.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                onClick={() => {
                  if (r.type === 'project') navigate(`/projects/${r.id}`);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#141414] text-left transition-colors"
              >
                <Chip tone="neutral">{r.type.toUpperCase()}</Chip>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-slate-100 truncate">{r.title}</p>
                  {r.excerpt ? (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{r.excerpt}</p>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </ScreenContainer>
  );
}
