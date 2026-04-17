import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, Chip, EmptyState } from '../ui';
import { LayoutTemplate, AlertCircle, Loader2 } from 'lucide-react';
import { useProjectTemplates } from '../hooks/use-data';

export function TemplatesScreen() {
  const templates = useProjectTemplates();
  const items = templates.data ?? [];

  return (
    <ScreenContainer>
      <SectionHeader title="Project Templates" />
      {templates.isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /></div>
      ) : templates.isError ? (
        <EmptyState icon={AlertCircle} title="Could not load templates" description={templates.error instanceof Error ? templates.error.message : 'Try again later.'} />
      ) : items.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title="No templates" description="System templates will appear here." />
      ) : (
        <div className="divide-y divide-[#1A1A1A]">
          {items.map((t) => (
            <button
              key={t.id}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#141414] text-left transition-colors"
            >
              <span className="size-8 rounded-[4px] bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#0066FF] flex items-center justify-center flex-shrink-0">
                <LayoutTemplate className="w-4 h-4" strokeWidth={1.75} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Chip tone="neutral">{t.category.toUpperCase()}</Chip>
                  <span className="font-mono text-[10px] text-slate-500">{t.taskTemplates.length} tasks</span>
                </div>
                <p className="text-[13px] text-slate-200 mt-0.5">{t.name}</p>
                {t.description ? (
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{t.description}</p>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      )}
    </ScreenContainer>
  );
}
