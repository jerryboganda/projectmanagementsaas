import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, Chip, EmptyState } from '../ui';
import { FileText, ChevronRight, AlertCircle, Loader2, FilePlus } from 'lucide-react';
import { useDocuments } from '../hooks/use-data';
import { formatShortDate } from '../data/adapters';

export function DocsScreen() {
  const docs = useDocuments({ pageSize: 100 });
  const items = docs.data ?? [];

  return (
    <ScreenContainer>
      <SectionHeader title="Workspace Docs" />
      {docs.isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /></div>
      ) : docs.isError ? (
        <EmptyState icon={AlertCircle} title="Could not load docs" description={docs.error instanceof Error ? docs.error.message : 'Try again later.'} />
      ) : items.length === 0 ? (
        <EmptyState icon={FilePlus} title="No documents" description="Create the first doc in this workspace." />
      ) : (
        <div className="divide-y divide-[#1A1A1A]">
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#141414] text-left transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
              <span className="flex-1 text-[13px] text-slate-200 truncate">{n.title}</span>
              <Chip tone="neutral">{formatShortDate(n.updatedAt)}</Chip>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          ))}
        </div>
      )}
    </ScreenContainer>
  );
}
