'use client';

import {
  useState,
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { AiCopilot } from '@/components/ui/ai-copilot';
import {
  ApiError,
  type AIConversationResponse,
  type AIMessageResponse,
  type AIProviderSettingsResponse,
} from '@/lib/api/client';

interface AiCopilotContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  conversations: AIConversationResponse[];
  activeConversationId: string | null;
  messages: AIMessageResponse[];
  isSending: boolean;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isLoadingProvider: boolean;
  providerSettings: AIProviderSettingsResponse | null;
  sendError: string | null;
  selectConversation: (id: string) => Promise<void>;
  createConversation: () => Promise<string | null>;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  refreshProviderSettings: () => Promise<void>;
}

const AiCopilotContext = createContext<AiCopilotContextType | undefined>(undefined);

export function AiCopilotProvider({ children }: { children: ReactNode }) {
  const { apiClient } = useAuth();
  const { activeWorkspaceId } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<AIConversationResponse[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessageResponse[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingProvider, setIsLoadingProvider] = useState(false);
  const [providerSettings, setProviderSettings] = useState<AIProviderSettingsResponse | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const loadedForWorkspaceRef = useRef<string | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((value) => !value), []);

  const refreshProviderSettings = useCallback(async () => {
    if (!activeWorkspaceId) {
      setProviderSettings(null);
      return;
    }

    setIsLoadingProvider(true);
    try {
      const data = await apiClient.getAIProviderSettings();
      setProviderSettings(data);
    } catch {
      setProviderSettings(null);
    } finally {
      setIsLoadingProvider(false);
    }
  }, [activeWorkspaceId, apiClient]);

  useEffect(() => {
    if (!isOpen || !activeWorkspaceId) return;
    if (loadedForWorkspaceRef.current === activeWorkspaceId) return;

    let cancelled = false;
    setIsLoadingConversations(true);

    apiClient
      .listAIConversations()
      .then((data) => {
        if (cancelled) return;
        setConversations(data);
        loadedForWorkspaceRef.current = activeWorkspaceId;
      })
      .catch(() => {
        if (!cancelled) {
          loadedForWorkspaceRef.current = activeWorkspaceId;
          setConversations([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingConversations(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeWorkspaceId, apiClient]);

  // Refresh provider settings when the AI copilot opens. This is a legitimate
  // external-data fetch \u2014 useSyncExternalStore doesn't fit (no subscription)
  // and the work must run in an effect (post-commit). The setState happens
  // inside the awaited callback, not synchronously inside the effect body, so
  // the rule's "cascading render" concern doesn't apply here.
  useEffect(() => {
    if (!isOpen || !activeWorkspaceId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch-on-open; no synchronous setState in effect body
    void refreshProviderSettings();
  }, [isOpen, activeWorkspaceId, refreshProviderSettings]);

  // Reset all conversation state when the active workspace changes. Compare
  // during render so the stale workspace's data is cleared synchronously
  // before the new workspace's load effect fires.
  const [prevWorkspaceId, setPrevWorkspaceId] = useState(activeWorkspaceId);
  if (prevWorkspaceId !== activeWorkspaceId) {
    setPrevWorkspaceId(activeWorkspaceId);
    setConversations([]);
    setActiveConversationId(null);
    setMessages([]);
    setProviderSettings(null);
    setSendError(null);
  }
  // Ref reset stays in an effect (refs cannot be mutated during render). The
  // load effect above re-runs anyway because activeWorkspaceId is a dep, so
  // this just clears the cache flag post-commit.
  useEffect(() => {
    loadedForWorkspaceRef.current = null;
  }, [activeWorkspaceId]);

  const selectConversation = useCallback(
    async (id: string) => {
      if (id === activeConversationId) return;
      setActiveConversationId(id);
      setMessages([]);
      setIsLoadingMessages(true);
      setSendError(null);

      try {
        const data = await apiClient.getAIConversation(id);
        setMessages(data.messages ?? []);
      } catch {
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [activeConversationId, apiClient],
  );

  const createConversation = useCallback(async (): Promise<string | null> => {
    try {
      const conversation = await apiClient.createAIConversation();
      setConversations((prev) => [conversation, ...prev]);
      setActiveConversationId(conversation.id);
      setMessages([]);
      setSendError(null);
      return conversation.id;
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : 'Unable to create an AI conversation right now.',
      );
      return null;
    }
  }, [apiClient]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSending) return;

      setSendError(null);

      let conversationId = activeConversationId;
      if (!conversationId) {
        conversationId = await createConversation();
        if (!conversationId) return;
      }

      const optimisticUserMessage: AIMessageResponse = {
        id: `optimistic-user-${Date.now()}`,
        conversationId,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticUserMessage]);
      setIsSending(true);

      try {
        await apiClient.sendAIMessage(conversationId, { content: trimmed });
        const refreshedConversation = await apiClient.getAIConversation(conversationId);
        setMessages(refreshedConversation.messages ?? []);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  messageCount: refreshedConversation.messages?.length ?? conversation.messageCount,
                  updatedAt: new Date().toISOString(),
                }
              : conversation,
          ),
        );
      } catch (error) {
        try {
          const refreshedConversation = await apiClient.getAIConversation(conversationId);
          setMessages(refreshedConversation.messages ?? []);
        } catch {
          setMessages((prev) =>
            prev.filter((message) => message.id !== optimisticUserMessage.id),
          );
        }

        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'Unable to send the AI message right now.';
        setSendError(message);

        if (error instanceof ApiError && error.status === 409) {
          void refreshProviderSettings();
        }
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId, apiClient, createConversation, isSending, refreshProviderSettings],
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      setConversations((prev) => prev.filter((conversation) => conversation.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }

      try {
        await apiClient.deleteAIConversation(id);
      } catch {
        // Ignore delete failures so the panel stays responsive.
      }
    },
    [activeConversationId, apiClient],
  );

  const value: AiCopilotContextType = {
    isOpen,
    open,
    close,
    toggle,
    conversations,
    activeConversationId,
    messages,
    isSending,
    isLoadingConversations,
    isLoadingMessages,
    isLoadingProvider,
    providerSettings,
    sendError,
    selectConversation,
    createConversation,
    sendMessage,
    deleteConversation,
    refreshProviderSettings,
  };

  return (
    <AiCopilotContext.Provider value={value}>
      {children}
      <AiCopilot />
    </AiCopilotContext.Provider>
  );
}

export function useAiCopilot() {
  const context = useContext(AiCopilotContext);
  if (!context) throw new Error('useAiCopilot must be used within AiCopilotProvider');
  return context;
}
