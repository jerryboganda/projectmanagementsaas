"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type {
  CreateDocumentRequest,
  DocumentResponse,
  UpdateDocumentRequest,
} from "@/lib/api/contracts";
import {
  matchesDocumentSearch,
  sortDocumentsByUpdatedAt,
  toCreateDocumentRequest,
  toUpdateDocumentRequest,
} from "@/components/docs/data";

export type DocFolder = "General" | "Engineering" | "Design" | "Marketing" | "Archive";

export const FOLDER_OPTIONS: DocFolder[] = [
  "General",
  "Engineering",
  "Design",
  "Marketing",
  "Archive",
];

export interface DocRevision {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  authorName: string;
}

function documentsQueryKey(workspaceId: string | null) {
  return ["documents", workspaceId, "list"] as const;
}

function documentDetailQueryKey(workspaceId: string | null, documentId: string | null) {
  return ["documents", workspaceId, documentId, "detail"] as const;
}

function loadFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("docs:favorites");
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed as string[]);
  } catch {
    // ignore
  }
  return new Set();
}

function saveFavorites(favorites: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("docs:favorites", JSON.stringify([...favorites]));
  } catch {
    // ignore
  }
}

function loadFolders(): Record<string, DocFolder> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("docs:folders");
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, DocFolder>;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveFolders(folders: Record<string, DocFolder>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("docs:folders", JSON.stringify(folders));
  } catch {
    // ignore
  }
}

function loadRevisions(): Record<string, DocRevision[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("docs:revisions");
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, DocRevision[]>;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveRevisions(revisions: Record<string, DocRevision[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("docs:revisions", JSON.stringify(revisions));
  } catch {
    // ignore
  }
}

export function useDocumentsData() {
  const { apiClient } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const [preferredSelectedDocumentId, setPreferredSelectedDocumentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<DocFolder | null>(null);

  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [docFolders, setDocFolders] = useState<Record<string, DocFolder>>(() => loadFolders());
  const [revisions, setRevisions] = useState<Record<string, DocRevision[]>>(() => loadRevisions());

  // Persist favorites to localStorage whenever they change
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  // Persist folder assignments to localStorage whenever they change
  useEffect(() => {
    saveFolders(docFolders);
  }, [docFolders]);

  // Persist revisions to localStorage whenever they change
  useEffect(() => {
    saveRevisions(revisions);
  }, [revisions]);

  const toggleFavorite = useCallback((docId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  }, []);

  const setDocFolder = useCallback((docId: string, folder: DocFolder) => {
    setDocFolders((prev) => ({ ...prev, [docId]: folder }));
  }, []);

  const getDocFolder = useCallback(
    (docId: string): DocFolder => docFolders[docId] ?? "General",
    [docFolders],
  );

  const addRevision = useCallback(
    (docId: string, revision: Omit<DocRevision, "id">) => {
      setRevisions((prev) => {
        const existing = prev[docId] ?? [];
        const newRevision: DocRevision = {
          ...revision,
          id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        };
        // Keep at most 20 revisions per document (newest first)
        const updated = [newRevision, ...existing].slice(0, 20);
        return { ...prev, [docId]: updated };
      });
    },
    [],
  );

  const getRevisions = useCallback(
    (docId: string): DocRevision[] => revisions[docId] ?? [],
    [revisions],
  );

  const documentsQuery = useQuery<DocumentResponse[]>({
    queryKey: documentsQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 15_000,
    queryFn: async () =>
      apiClient.listDocuments({
        pageSize: 100,
      }),
  });

  const documents = useMemo(
    () => sortDocumentsByUpdatedAt(documentsQuery.data ?? []),
    [documentsQuery.data],
  );

  const selectedDocumentId = useMemo(() => {
    if (documents.length === 0) {
      return null;
    }

    if (
      preferredSelectedDocumentId &&
      documents.some((document) => document.id === preferredSelectedDocumentId)
    ) {
      return preferredSelectedDocumentId;
    }

    return documents[0].id;
  }, [documents, preferredSelectedDocumentId]);

  const filteredDocuments = useMemo(() => {
    let result = documents.filter((document) => matchesDocumentSearch(document, searchQuery));
    if (activeFolder !== null) {
      result = result.filter((doc) => (docFolders[doc.id] ?? "General") === activeFolder);
    }
    // Favorites float to top when no folder filter is active
    if (activeFolder === null) {
      result = [
        ...result.filter((doc) => favorites.has(doc.id)),
        ...result.filter((doc) => !favorites.has(doc.id)),
      ];
    }
    return result;
  }, [documents, searchQuery, activeFolder, docFolders, favorites]);

  const selectedDocumentFromList = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  const selectedDocumentQuery = useQuery<DocumentResponse>({
    queryKey: documentDetailQueryKey(activeWorkspaceId, selectedDocumentId),
    enabled: !!activeWorkspaceId && !!selectedDocumentId,
    staleTime: 15_000,
    initialData: selectedDocumentFromList ?? undefined,
    queryFn: async () => apiClient.getDocument(selectedDocumentId!),
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (input: CreateDocumentRequest) =>
      apiClient.createDocument(toCreateDocumentRequest(input)),
    onSuccess: async (createdDocument) => {
      queryClient.setQueryData<DocumentResponse[]>(
        documentsQueryKey(activeWorkspaceId),
        (currentDocuments) =>
          sortDocumentsByUpdatedAt(
            [...(currentDocuments ?? []).filter((document) => document.id !== createdDocument.id), createdDocument],
          ),
      );
      setPreferredSelectedDocumentId(createdDocument.id);
      await queryClient.invalidateQueries({
        queryKey: documentsQueryKey(activeWorkspaceId),
      });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async ({
      documentId,
      input,
    }: {
      documentId: string;
      input: UpdateDocumentRequest;
    }) => apiClient.updateDocument(documentId, toUpdateDocumentRequest(input)),
    onSuccess: async (updatedDocument, variables) => {
      queryClient.setQueryData<DocumentResponse[]>(
        documentsQueryKey(activeWorkspaceId),
        (currentDocuments) =>
          currentDocuments
            ? sortDocumentsByUpdatedAt(
                currentDocuments.map((document) =>
                  document.id === variables.documentId ? updatedDocument : document,
                ),
              )
            : [updatedDocument],
      );

      queryClient.setQueryData<DocumentResponse>(
        documentDetailQueryKey(activeWorkspaceId, variables.documentId),
        updatedDocument,
      );

      await queryClient.invalidateQueries({
        queryKey: documentDetailQueryKey(activeWorkspaceId, variables.documentId),
      });
      await queryClient.invalidateQueries({
        queryKey: documentsQueryKey(activeWorkspaceId),
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => apiClient.deleteDocument(documentId),
    onSuccess: async (_void, documentId) => {
      queryClient.setQueryData<DocumentResponse[]>(
        documentsQueryKey(activeWorkspaceId),
        (currentDocuments) =>
          currentDocuments ? currentDocuments.filter((document) => document.id !== documentId) : [],
      );

      queryClient.removeQueries({
        queryKey: documentDetailQueryKey(activeWorkspaceId, documentId),
      });

      if (selectedDocumentId === documentId) {
        setPreferredSelectedDocumentId(null);
      }

      await queryClient.invalidateQueries({
        queryKey: documentsQueryKey(activeWorkspaceId),
      });
    },
  });

  const recentDocuments = useMemo(() => documents.slice(0, 5), [documents]);
  const totalCount = documents.length;
  const visibleCount = filteredDocuments.length;

  const folderCounts = useMemo(() => {
    const counts: Record<DocFolder, number> = {
      General: 0,
      Engineering: 0,
      Design: 0,
      Marketing: 0,
      Archive: 0,
    };
    for (const doc of documents) {
      const folder = docFolders[doc.id] ?? "General";
      counts[folder] = (counts[folder] ?? 0) + 1;
    }
    return counts;
  }, [documents, docFolders]);

  const favoritedDocuments = useMemo(
    () => documents.filter((doc) => favorites.has(doc.id)),
    [documents, favorites],
  );

  const isLoading = documentsQuery.isPending;
  const isFetchingSelected = selectedDocumentQuery.isFetching;
  const error = documentsQuery.error ?? selectedDocumentQuery.error ?? null;

  return {
    activeWorkspaceId,
    documentsQuery,
    selectedDocumentQuery,
    documents,
    filteredDocuments,
    recentDocuments,
    favoritedDocuments,
    totalCount,
    visibleCount,
    selectedDocumentId,
    setSelectedDocumentId: setPreferredSelectedDocumentId,
    selectedDocument: selectedDocumentQuery.data ?? selectedDocumentFromList ?? null,
    searchQuery,
    setSearchQuery,
    activeFolder,
    setActiveFolder,
    favorites,
    toggleFavorite,
    docFolders,
    setDocFolder,
    getDocFolder,
    folderCounts,
    addRevision,
    getRevisions,
    createDocument: async (input: CreateDocumentRequest) =>
      createDocumentMutation.mutateAsync(input),
    updateDocument: async (documentId: string, input: UpdateDocumentRequest) =>
      updateDocumentMutation.mutateAsync({ documentId, input }),
    deleteDocument: async (documentId: string) => deleteDocumentMutation.mutateAsync(documentId),
    isLoading,
    isFetchingSelected,
    isCreatingDocument: createDocumentMutation.isPending,
    isUpdatingDocument: updateDocumentMutation.isPending,
    isDeletingDocument: deleteDocumentMutation.isPending,
    error,
    hasLiveDocumentsFeature: !!activeWorkspaceId,
  };
}
