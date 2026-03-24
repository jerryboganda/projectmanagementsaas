'use client';

import { useEffect, useState, type ChangeEvent, type ElementType } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ExternalLink,
  Globe,
  Link2,
  Link2Off,
  Loader2,
  Plus,
  Settings,
  Trash2,
  Webhook,
  X,
} from 'lucide-react';
import { FormField } from '@/components/ui/form-field';
import { useAuth } from '@/contexts/auth-context';
import type { AIProviderSettingsResponse } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  connected: boolean;
  configuredAt?: string;
  docsUrl?: string;
}

interface WebhookEntry {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered: string | null;
}

interface ToastState {
  tone: 'success' | 'error';
  text: string;
}

interface AIProviderFormState {
  providerName: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  isEnabled: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Create issues and receive real-time notifications directly in Slack channels.',
    category: 'Communication',
    connected: true,
    configuredAt: 'Feb 12, 2026',
    docsUrl: 'https://slack.com',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link pull requests and commits to tasks. Auto-close issues on merge.',
    category: 'Development',
    connected: true,
    configuredAt: 'Jan 5, 2026',
    docsUrl: 'https://github.com',
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Import projects and issues from Jira Cloud or Server for a smooth migration.',
    category: 'Import',
    connected: false,
    docsUrl: 'https://atlassian.com/jira',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync task due dates and milestones with your Google Calendar.',
    category: 'Productivity',
    connected: false,
    docsUrl: 'https://calendar.google.com',
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Embed Figma frames and prototypes directly inside tasks and documents.',
    category: 'Design',
    connected: false,
    docsUrl: 'https://figma.com',
  },
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Automatically create tasks from Sentry errors and link issues to releases.',
    category: 'Development',
    connected: false,
    docsUrl: 'https://sentry.io',
  },
];

const CATEGORY_ICONS: Record<string, ElementType> = {
  Communication: Globe,
  Development: Settings,
  Import: Link2,
  Productivity: CheckCircle2,
  Design: Settings,
};

function IntegrationLogo({ id }: { id: string }) {
  const colors: Record<string, string> = {
    slack: 'bg-[#4A154B]/30 text-[#E01E5A]',
    github: 'bg-white/10 text-slate-200',
    jira: 'bg-[#0052CC]/20 text-[#4C9AFF]',
    'google-calendar': 'bg-[#1A73E8]/20 text-[#4285F4]',
    figma: 'bg-[#FF7262]/15 text-[#FF7262]',
    sentry: 'bg-[#362D59]/40 text-[#7C4DFF]',
  };

  const labels: Record<string, string> = {
    slack: 'SL',
    github: 'GH',
    jira: 'JR',
    'google-calendar': 'GC',
    figma: 'FG',
    sentry: 'SE',
  };

  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
        colors[id] ?? 'bg-neutral-border/40 text-slate-400',
      )}
    >
      {labels[id] ?? id.slice(0, 2).toUpperCase()}
    </div>
  );
}

function toFormState(settings?: AIProviderSettingsResponse | null): AIProviderFormState {
  return {
    providerName: settings?.providerName || 'OpenAI-Compatible',
    baseUrl: settings?.baseUrl || '',
    model: settings?.model || '',
    apiKey: '',
    isEnabled: settings?.isConfigured ? settings.isEnabled : true,
  };
}

export function IntegrationsPanel() {
  const { apiClient } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [providerSettings, setProviderSettings] = useState<AIProviderSettingsResponse | null>(null);
  const [providerForm, setProviderForm] = useState<AIProviderFormState>(toFormState());
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);
  const [isSavingProvider, setIsSavingProvider] = useState(false);
  const [isDeletingProvider, setIsDeletingProvider] = useState(false);

  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([
    {
      id: 'wh1',
      name: 'Deployment Notifier',
      url: 'https://hooks.example.com/deploy',
      events: ['task.created', 'sprint.completed'],
      active: true,
      lastTriggered: 'Mar 24, 2026',
    },
  ]);
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [addingWebhook, setAddingWebhook] = useState(false);
  const [webhookFormOpen, setWebhookFormOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProviderSettings = async () => {
      setIsLoadingProvider(true);
      try {
        const settings = await apiClient.getAIProviderSettings();
        if (cancelled) return;
        setProviderSettings(settings);
        setProviderForm(toFormState(settings));
      } catch (error) {
        if (cancelled) return;
        setToast({
          tone: 'error',
          text: error instanceof Error ? error.message : 'Unable to load AI provider settings.',
        });
      } finally {
        if (!cancelled) {
          setIsLoadingProvider(false);
        }
      }
    };

    void loadProviderSettings();

    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  const handleConnect = async (integrationId: string) => {
    setActionInProgress(integrationId);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === integrationId
          ? {
              ...integration,
              connected: !integration.connected,
              configuredAt: !integration.connected ? 'Mar 24, 2026' : undefined,
            }
          : integration,
      ),
    );

    const integration = integrations.find((item) => item.id === integrationId);
    setToast({
      tone: 'success',
      text: integration?.connected
        ? `${integration.name} disconnected.`
        : `${integration?.name} connected successfully.`,
    });
    setActionInProgress(null);
  };

  const handleAddWebhook = async () => {
    if (!webhookName.trim() || !webhookUrl.trim()) return;
    setAddingWebhook(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setWebhooks((prev) => [
      ...prev,
      {
        id: `wh${Date.now()}`,
        name: webhookName.trim(),
        url: webhookUrl.trim(),
        events: ['task.created'],
        active: true,
        lastTriggered: null,
      },
    ]);
    setWebhookName('');
    setWebhookUrl('');
    setWebhookFormOpen(false);
    setAddingWebhook(false);
    setToast({ tone: 'success', text: 'Webhook created.' });
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((webhook) => webhook.id !== id));
    setToast({ tone: 'success', text: 'Webhook deleted.' });
  };

  const handleProviderFieldChange = (
    field: keyof AIProviderFormState,
    value: string | boolean,
  ) => {
    setProviderForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProvider = async () => {
    setIsSavingProvider(true);
    setToast(null);

    try {
      const saved = await apiClient.updateAIProviderSettings({
        providerName: providerForm.providerName.trim(),
        baseUrl: providerForm.baseUrl.trim(),
        model: providerForm.model.trim(),
        apiKey: providerForm.apiKey.trim() || undefined,
        isEnabled: providerForm.isEnabled,
      });

      setProviderSettings(saved);
      setProviderForm(toFormState(saved));
      setToast({ tone: 'success', text: 'AI provider saved. AI Copilot can use it immediately.' });
    } catch (error) {
      setToast({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to save AI provider settings.',
      });
    } finally {
      setIsSavingProvider(false);
    }
  };

  const handleDeleteProvider = async () => {
    setIsDeletingProvider(true);
    setToast(null);

    try {
      await apiClient.deleteAIProviderSettings();
      const emptyState = {
        id: null,
        providerName: 'OpenAI-Compatible',
        baseUrl: '',
        model: '',
        isEnabled: false,
        isConfigured: false,
        maskedApiKey: null,
        updatedAt: null,
      } satisfies AIProviderSettingsResponse;
      setProviderSettings(emptyState);
      setProviderForm(toFormState(emptyState));
      setToast({ tone: 'success', text: 'AI provider removed.' });
    } catch (error) {
      setToast({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to remove the AI provider.',
      });
    } finally {
      setIsDeletingProvider(false);
    }
  };

  const categories = Array.from(new Set(integrations.map((integration) => integration.category)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mx-auto max-w-5xl px-8 py-8"
    >
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Integrations</h1>
        <p className="mt-2 text-sm text-slate-400">
          Connect third-party tools, configure outgoing webhooks, and manage your integration ecosystem.
        </p>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.text}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm',
              toast.tone === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/20 bg-rose-500/10 text-rose-200',
            )}
          >
            <div className="flex items-center gap-2">
              {toast.tone === 'success' ? (
                <CheckCircle2 className="size-4 shrink-0" />
              ) : (
                <AlertCircle className="size-4 shrink-0" />
              )}
              {toast.text}
            </div>
            <button
              onClick={() => setToast(null)}
              className={cn(
                toast.tone === 'success'
                  ? 'text-emerald-400 hover:text-emerald-200'
                  : 'text-rose-300 hover:text-rose-100',
              )}
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="space-y-10">
        <section className="space-y-6">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200">
              <Bot className="size-4 text-primary" />
              AI Provider
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Attach an OpenAI-compatible base URL, model, and API key. The key is stored for your current account and workspace, and AI Copilot starts using it automatically.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-border bg-neutral-surface/30 px-5 py-5">
            {isLoadingProvider ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="size-4 animate-spin" />
                Loading AI provider settings...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium',
                      providerSettings?.isConfigured && providerSettings.isEnabled
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'bg-amber-500/10 text-amber-200',
                    )}
                  >
                    {providerSettings?.isConfigured && providerSettings.isEnabled
                      ? 'Connected'
                      : 'Not Connected'}
                  </span>
                  {providerSettings?.maskedApiKey ? (
                    <span className="text-xs text-slate-500">
                      {providerSettings.maskedApiKey}
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Provider Name"
                    value={providerForm.providerName}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleProviderFieldChange('providerName', event.target.value)
                    }
                  />
                  <FormField
                    label="Model"
                    placeholder="gpt-4.1-mini"
                    value={providerForm.model}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleProviderFieldChange('model', event.target.value)
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                  <FormField
                    label="Base URL"
                    placeholder="https://api.openai.com/v1"
                    value={providerForm.baseUrl}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleProviderFieldChange('baseUrl', event.target.value)
                    }
                    hint="Use the provider root or /v1 base. The backend will call the standard chat completions path."
                  />
                  <FormField
                    label="API Key"
                    type="password"
                    placeholder={providerSettings?.isConfigured ? 'Leave blank to keep stored key' : 'sk-...'}
                    value={providerForm.apiKey}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleProviderFieldChange('apiKey', event.target.value)
                    }
                    hint={
                      providerSettings?.isConfigured
                        ? 'Leave this blank to keep the currently stored key.'
                        : 'Enter the provider API key to connect AI Copilot.'
                    }
                  />
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-neutral-border/70 bg-black/10 px-4 py-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={providerForm.isEnabled}
                    onChange={(event) => handleProviderFieldChange('isEnabled', event.target.checked)}
                    className="size-4 rounded border-neutral-border bg-transparent text-primary focus:ring-primary"
                  />
                  Enable this provider for AI Copilot
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => void handleSaveProvider()}
                    disabled={isSavingProvider}
                    className={cn(
                      'flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90',
                      isSavingProvider && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    {isSavingProvider ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Bot className="size-4" />
                    )}
                    {isSavingProvider ? 'Saving...' : 'Save AI Provider'}
                  </button>

                  <button
                    onClick={() => void handleDeleteProvider()}
                    disabled={!providerSettings?.isConfigured || isDeletingProvider}
                    className={cn(
                      'flex items-center gap-2 rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-500/20',
                      (!providerSettings?.isConfigured || isDeletingProvider) &&
                        'cursor-not-allowed opacity-60',
                    )}
                  >
                    {isDeletingProvider ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    {isDeletingProvider ? 'Removing...' : 'Remove Provider'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {categories.map((category) => {
          const CategoryIcon = CATEGORY_ICONS[category] ?? Globe;
          const categoryItems = integrations.filter((integration) => integration.category === category);

          return (
            <section key={category} className="space-y-4">
              <div className="border-b border-neutral-border/60 pb-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200">
                  <CategoryIcon className="size-4 text-primary" />
                  {category}
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {categoryItems.map((integration) => {
                  const isLoading = actionInProgress === integration.id;

                  return (
                    <div
                      key={integration.id}
                      className={cn(
                        'flex flex-col gap-4 rounded-xl border px-5 py-5 transition-colors',
                        integration.connected
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-neutral-border bg-neutral-surface/30',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <IntegrationLogo id={integration.id} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-200">{integration.name}</p>
                              {integration.connected ? (
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                                  Connected
                                </span>
                              ) : null}
                            </div>
                            {integration.connected && integration.configuredAt ? (
                              <p className="text-xs text-slate-500">Since {integration.configuredAt}</p>
                            ) : null}
                          </div>
                        </div>
                        {integration.docsUrl ? (
                          <a
                            href={integration.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-600 transition-colors hover:text-slate-400"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        ) : null}
                      </div>

                      <p className="text-xs text-slate-400">{integration.description}</p>

                      <button
                        onClick={() => void handleConnect(integration.id)}
                        disabled={isLoading}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                          integration.connected
                            ? 'border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                            : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20',
                          isLoading && 'cursor-not-allowed opacity-60',
                        )}
                      >
                        {isLoading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : integration.connected ? (
                          <Link2Off className="size-4" />
                        ) : (
                          <Link2 className="size-4" />
                        )}
                        {isLoading
                          ? integration.connected
                            ? 'Disconnecting...'
                            : 'Connecting...'
                          : integration.connected
                          ? 'Disconnect'
                          : 'Connect'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-border/60 pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200">
                <Webhook className="size-4 text-primary" />
                Outgoing Webhooks
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Send HTTP POST payloads to external URLs when events occur.
              </p>
            </div>
            <button
              onClick={() => setWebhookFormOpen((value) => !value)}
              className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Plus className="size-4" />
              Add Webhook
            </button>
          </div>

          <AnimatePresence>
            {webhookFormOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-4 grid gap-4 rounded-xl border border-neutral-border bg-neutral-surface/30 px-5 py-5 md:grid-cols-2">
                  <FormField
                    label="Webhook Name"
                    placeholder="e.g. Deployment Notifier"
                    value={webhookName}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setWebhookName(event.target.value)}
                  />
                  <FormField
                    label="Endpoint URL"
                    placeholder="https://hooks.example.com/payload"
                    value={webhookUrl}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setWebhookUrl(event.target.value)}
                  />
                  <div className="flex gap-3 md:col-span-2">
                    <button
                      onClick={() => void handleAddWebhook()}
                      disabled={!webhookName.trim() || !webhookUrl.trim() || addingWebhook}
                      className={cn(
                        'flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90',
                        (!webhookName.trim() || !webhookUrl.trim() || addingWebhook) &&
                          'cursor-not-allowed opacity-60',
                      )}
                    >
                      {addingWebhook ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                      {addingWebhook ? 'Creating...' : 'Create Webhook'}
                    </button>
                    <button
                      onClick={() => setWebhookFormOpen(false)}
                      className="rounded-md border border-neutral-border px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {webhooks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-border bg-neutral-surface/20 px-6 py-10 text-center">
              <Webhook className="mx-auto mb-3 size-8 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">No webhooks configured</p>
              <p className="mt-1 text-xs text-slate-500">
                Create a webhook to push events to external services.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-border">
              <div className="grid grid-cols-[1fr_1fr_120px_60px] gap-4 border-b border-neutral-border/60 bg-neutral-surface/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Name</span>
                <span>URL</span>
                <span>Last Triggered</span>
                <span />
              </div>
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="grid grid-cols-[1fr_1fr_120px_60px] gap-4 border-b border-neutral-border/30 px-5 py-4 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'size-1.5 shrink-0 rounded-full',
                        webhook.active ? 'bg-emerald-400' : 'bg-slate-600',
                      )}
                    />
                    <span className="text-sm font-medium text-slate-200">{webhook.name}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="truncate font-mono text-xs text-slate-400">{webhook.url}</span>
                    <a
                      href={webhook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-slate-600 hover:text-slate-400"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <span className="self-center text-xs text-slate-500">
                    {webhook.lastTriggered ?? 'Never'}
                  </span>
                  <div className="flex justify-end self-center">
                    <button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="text-slate-600 transition-colors hover:text-rose-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-neutral-border/40 bg-neutral-surface/20 px-4 py-3">
            <AlertCircle className="size-4 shrink-0 text-slate-500" />
            <p className="text-xs text-slate-500">
              Webhook delivery and retry logic still needs a backend integration contract. Current entries remain UI-local until that lands.
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
