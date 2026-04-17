import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, Chip, EmptyState } from '../ui';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';
import { useAutomations } from '../hooks/use-data';
import { api, type AutomationRuleResponse } from '../api/client';

function describe(obj: unknown): string {
  if (!obj || typeof obj !== 'object') return String(obj ?? '—');
  const o = obj as Record<string, unknown>;
  if (typeof o.type === 'string') return o.type;
  if (typeof o.event === 'string') return o.event;
  const keys = Object.keys(o).slice(0, 2).join(', ');
  return keys || '—';
}

export function AutomationsScreen() {
  const qc = useQueryClient();
  const automations = useAutomations({ pageSize: 50 });
  const items = automations.data ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = async (rule: AutomationRuleResponse) => {
    setBusyId(rule.id);
    try {
      await api.automations.update(rule.id, {
        name: rule.name,
        description: rule.description,
        isActive: !rule.isActive,
        trigger: rule.trigger,
        action: rule.action,
        projectId: rule.projectId,
      });
      await qc.invalidateQueries({ queryKey: ['automations'] });
    } catch {
      // noop
    } finally {
      setBusyId(null);
    }
  };

  const active = items.filter((r) => r.isActive).length;

  return (
    <ScreenContainer>
      <section className="px-4 py-4 border-b border-[#1A1A1A] flex items-center gap-3">
        <span className="size-8 rounded-[4px] bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#0066FF] flex items-center justify-center">
          <Zap className="w-4 h-4" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[13px] text-slate-200">{active} active automations</p>
          <p className="font-mono text-[11px] text-slate-500">{items.length - active} paused</p>
        </div>
      </section>

      <SectionHeader title="Rules" />
      {automations.isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /></div>
      ) : automations.isError ? (
        <EmptyState icon={AlertCircle} title="Could not load automations" description={automations.error instanceof Error ? automations.error.message : 'Try again later.'} />
      ) : items.length === 0 ? (
        <EmptyState icon={Zap} title="No automations" description="Create a rule to automate routine work." />
      ) : (
        <div className="divide-y divide-[#1A1A1A]">
          {items.map((r) => (
            <div key={r.id} className="px-4 py-3 hover:bg-[#141414] transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-slate-200 truncate">{r.name}</p>
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  disabled={busyId === r.id}
                  className={`w-9 h-5 rounded-full relative transition-colors ${r.isActive ? 'bg-[#0066FF]' : 'bg-[#222]'} disabled:opacity-50`}
                  aria-label={r.isActive ? 'Disable' : 'Enable'}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${r.isActive ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <p className="font-mono text-[11px] text-slate-500 mt-1">
                WHEN <span className="text-slate-300">{describe(r.trigger)}</span> → DO{' '}
                <span className="text-slate-300">{describe(r.action)}</span>
              </p>
              <div className="mt-1.5">
                <Chip tone="neutral">{r.executionCount} runs</Chip>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScreenContainer>
  );
}
