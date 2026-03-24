'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  Bot,
  FileText,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAiCopilot } from '@/components/ai-copilot-provider';

// ─── Quick actions ────────────────────────────────────────────────────────────

interface QuickAction {
  icon: typeof Sparkles;
  label: string;
  prompt: string;
}

const quickActions: QuickAction[] = [
  {
    icon: ListChecks,
    label: 'Generate subtasks',
    prompt: 'Break down the current task into actionable subtasks',
  },
  {
    icon: FileText,
    label: 'Write status update',
    prompt: 'Write a brief status update for the current project',
  },
  {
    icon: AlertTriangle,
    label: 'Identify risks',
    prompt: 'What are the potential risks and blockers for this project?',
  },
  {
    icon: Lightbulb,
    label: 'Suggest next steps',
    prompt: 'What should the team focus on next?',
  },
];

// ─── Markdown renderer ────────────────────────────────────────────────────────

function AssistantMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="my-0 text-[12px] leading-relaxed text-slate-200">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        ul: ({ children }) => (
          <ul className="my-0 list-disc space-y-1.5 pl-4 text-[12px] text-slate-200">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-0 list-decimal space-y-1.5 pl-4 text-[12px] text-slate-200">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed marker:text-slate-500">{children}</li>
        ),
        code: ({ className, children }) => {
          const isBlock = Boolean(className);
          if (isBlock) {
            return (
              <code className="block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-slate-100">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[11px] text-sky-200">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="my-0 overflow-x-auto">{children}</pre>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-sky-300 underline decoration-sky-400/40 underline-offset-2 transition-colors hover:text-sky-200"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ─── Conversation sidebar ─────────────────────────────────────────────────────

interface ConversationSidebarProps {
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function ConversationSidebar({ onSelect, onNew, onDelete }: ConversationSidebarProps) {
  const { conversations, activeConversationId, isLoadingConversations } = useAiCopilot();

  return (
    <div className="flex w-[180px] shrink-0 flex-col border-r border-neutral-border">
      <div className="flex items-center justify-between border-b border-neutral-border px-3 py-2.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Conversations
        </span>
        <button
          onClick={onNew}
          className="rounded-sm p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
          aria-label="New conversation"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {isLoadingConversations ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-4 animate-spin text-slate-600" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <MessageSquare className="mx-auto mb-2 size-5 text-slate-700" />
            <p className="text-[10px] text-slate-600">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'group flex cursor-pointer items-center gap-1.5 px-2 py-1.5 transition-colors',
                activeConversationId === conv.id
                  ? 'bg-primary/10 text-slate-200'
                  : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-300',
              )}
              onClick={() => onSelect(conv.id)}
            >
              <MessageSquare
                className={cn(
                  'size-3 shrink-0',
                  activeConversationId === conv.id ? 'text-primary' : 'text-slate-600',
                )}
              />
              <span className="flex-1 truncate text-[11px]">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="hidden shrink-0 rounded p-0.5 text-slate-600 transition-colors hover:text-red-400 group-hover:flex"
                aria-label="Delete conversation"
              >
                <Trash2 className="size-2.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

const FOCUS_DELAY_MS = 100;

export function AiCopilot() {
  const {
    isOpen,
    close,
    messages,
    isSending,
    isLoadingMessages,
    isLoadingProvider,
    providerSettings,
    sendError,
    selectConversation,
    createConversation,
    sendMessage,
    deleteConversation,
    activeConversationId,
  } = useAiCopilot();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), FOCUS_DELAY_MS);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setInput('');
    void sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput('');
    void sendMessage(prompt);
  };

  const handleNew = () => {
    void createConversation();
  };

  const handleSelect = (id: string) => {
    void selectConversation(id);
  };

  const handleDelete = (id: string) => {
    void deleteConversation(id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — transparent click-through so user can still interact with app */}
          <motion.div
            key="ai-copilot-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            key="ai-copilot-panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 z-50 flex w-[580px] flex-col border-l border-neutral-border bg-zinc-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-border px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-6 items-center justify-center rounded-sm bg-primary/20">
                  <Sparkles className="size-3.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-100">AI Copilot</h3>
                  <p className="text-[10px] text-slate-500">
                    {activeConversationId ? 'Active conversation' : 'Start a new conversation'}
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                className="rounded-sm p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
                aria-label="Close AI Copilot"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body: sidebar + chat */}
            <div className="flex min-h-0 flex-1">
              <ConversationSidebar
                onSelect={handleSelect}
                onNew={handleNew}
                onDelete={handleDelete}
              />

              {/* Chat area */}
              <div className="flex min-w-0 flex-1 flex-col">
                {!isLoadingProvider && providerSettings && !providerSettings.isConfigured ? (
                  <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[11px] text-amber-200">
                    Attach an OpenAI-compatible provider in Settings &gt; Integrations to enable live AI replies.
                  </div>
                ) : null}

                {sendError ? (
                  <div className="border-b border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[11px] text-rose-200">
                    {sendError}
                  </div>
                ) : null}

                {/* Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {isLoadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="size-5 animate-spin text-slate-600" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                      <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="size-6 text-primary" />
                      </div>
                      <h4 className="mb-1 text-sm font-medium text-slate-200">How can I help?</h4>
                      <p className="mb-6 max-w-[260px] text-[12px] text-slate-500">
                        Ask me about your projects, tasks, or use a quick action to get started.
                      </p>
                      <div className="grid w-full max-w-[300px] grid-cols-2 gap-2">
                        {quickActions.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => handleQuickAction(action.prompt)}
                            disabled={isSending}
                            className="flex items-center gap-2 rounded-sm border border-neutral-border px-3 py-2 text-left transition-colors hover:border-slate-700 hover:bg-white/5 disabled:opacity-50"
                          >
                            <action.icon className="size-3.5 shrink-0 text-slate-400" />
                            <span className="text-[11px] text-slate-300">{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          'flex gap-2.5',
                          msg.role === 'user' ? 'flex-row-reverse' : '',
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm',
                            msg.role === 'user' ? 'bg-primary/20' : 'bg-emerald-500/20',
                          )}
                        >
                          {msg.role === 'user' ? (
                            <User className="size-3.5 text-primary" />
                          ) : (
                            <Bot className="size-3.5 text-emerald-500" />
                          )}
                        </div>
                        <div
                          className={cn(
                            'min-w-0 flex-1',
                            msg.role === 'user' ? 'text-right' : '',
                          )}
                        >
                          <div
                            className={cn(
                              'inline-block max-w-full rounded-sm px-3 py-2 text-left',
                              msg.role === 'user'
                                ? 'border border-primary/20 bg-primary/10'
                                : 'border border-neutral-border bg-white/[0.03]',
                            )}
                          >
                            {msg.role === 'assistant' ? (
                              <div className="max-w-full space-y-3">
                                <AssistantMessage content={msg.content} />
                              </div>
                            ) : (
                              <p className="whitespace-pre-line text-[12px] leading-relaxed text-slate-200">
                                {msg.content}
                              </p>
                            )}
                          </div>
                          <p className="mt-1 text-[9px] font-mono text-slate-600">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}

                  {/* Sending indicator */}
                  {isSending && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2.5"
                    >
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-emerald-500/20">
                        <Bot className="size-3.5 text-emerald-500" />
                      </div>
                      <div className="flex items-center gap-2 rounded-sm border border-neutral-border bg-white/[0.03] px-3 py-2">
                        <Loader2 className="size-3 animate-spin text-slate-400" />
                        <span className="text-[11px] text-slate-500">Thinking...</span>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick-action chips when messages are present */}
                {messages.length > 0 && (
                  <div className="flex shrink-0 gap-1.5 overflow-x-auto border-t border-neutral-border/50 px-3 py-2">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.prompt)}
                        disabled={isSending}
                        className="flex shrink-0 items-center gap-1 rounded-sm border border-neutral-border px-2 py-1 text-[10px] text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-300 disabled:opacity-50"
                      >
                        <action.icon className="size-2.5" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input area */}
                <div className="shrink-0 border-t border-neutral-border p-3">
                  <div className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask anything about your projects..."
                      rows={1}
                      disabled={isSending}
                      className="flex-1 resize-none rounded-sm border border-neutral-border bg-zinc-950 px-3 py-2 text-[13px] text-slate-200 placeholder:text-slate-600 transition-colors focus:border-primary focus:outline-none disabled:opacity-60"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isSending}
                      className="flex items-center justify-center rounded-sm bg-primary px-3 text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Send message"
                    >
                      {isSending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-center text-[9px] text-slate-600">
                    AI replies use your saved OpenAI-compatible provider settings.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
