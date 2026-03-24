"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, FileText, Loader2, RefreshCw } from "lucide-react";
import { DocsSidebar } from "./docs-sidebar";
import { DocsEditor } from "./docs-editor";
import { createUntitledDocumentRequest } from "./data";
import { useDocumentsData } from "@/hooks/use-documents-data";

export function DocsLayout() {
  const {
    documentsQuery,
    selectedDocument,
    selectedDocumentId,
    setSelectedDocumentId,
    searchQuery,
    setSearchQuery,
    documents,
    filteredDocuments,
    recentDocuments,
    favoritedDocuments,
    totalCount,
    visibleCount,
    createDocument,
    updateDocument,
    deleteDocument,
    isLoading,
    isCreatingDocument,
    isUpdatingDocument,
    isDeletingDocument,
    error,
    activeWorkspaceId,
    activeFolder,
    setActiveFolder,
    favorites,
    toggleFavorite,
    setDocFolder,
    getDocFolder,
    folderCounts,
    addRevision,
    getRevisions,
  } = useDocumentsData();

  const handleCreateDoc = async () => {
    await createDocument(createUntitledDocumentRequest());
  };

  const shouldShowLoadingState = isLoading && documents.length === 0;
  const shouldShowErrorState = !!error && documents.length === 0;
  const hasNoWorkspace = !activeWorkspaceId;

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-background-dark">
      <DocsSidebar
        documents={filteredDocuments}
        recentDocuments={recentDocuments}
        favoritedDocuments={favoritedDocuments}
        selectedDocId={selectedDocumentId}
        onSelectDoc={setSelectedDocumentId}
        onCreateDoc={handleCreateDoc}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isCreatingDocument={isCreatingDocument}
        isLoading={documentsQuery.isPending}
        visibleCount={visibleCount}
        totalCount={totalCount}
        activeFolder={activeFolder}
        onFolderChange={setActiveFolder}
        folderCounts={folderCounts}
        favorites={favorites}
      />

      <div className="relative flex min-w-0 flex-1 flex-col bg-neutral-surface/30">
        <AnimatePresence mode="wait">
          {shouldShowLoadingState ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-background-dark/50 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-4 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-sm">Loading documents from the workspace</div>
              </div>
            </motion.div>
          ) : shouldShowErrorState ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 items-center justify-center px-8"
            >
              <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/8 px-6 py-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Documents failed to load</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  The live documents API returned an error. Please retry after checking the backend
                  is reachable for the active workspace.
                </p>
                <button
                  type="button"
                  onClick={() => documentsQuery.refetch()}
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            </motion.div>
          ) : hasNoWorkspace ? (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 items-center justify-center px-8"
            >
              <div className="max-w-md rounded-2xl border border-neutral-border bg-neutral-surface px-6 py-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Pick a workspace</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Documents are loaded per workspace. Select an active workspace to view and edit
                  live documents.
                </p>
              </div>
            </motion.div>
          ) : selectedDocument ? (
            <DocsEditor
              key={`${selectedDocument.id}:${selectedDocument.updatedAt}`}
              doc={selectedDocument}
              onSave={updateDocument}
              onDelete={deleteDocument}
              onCreateNew={createDocument}
              isSaving={isUpdatingDocument}
              isDeleting={isDeletingDocument}
              isFavorite={favorites.has(selectedDocument.id)}
              onToggleFavorite={() => toggleFavorite(selectedDocument.id)}
              currentFolder={getDocFolder(selectedDocument.id)}
              onMoveToFolder={(folder) => setDocFolder(selectedDocument.id, folder)}
              revisions={getRevisions(selectedDocument.id)}
              onAddRevision={(revision) => addRevision(selectedDocument.id, revision)}
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 items-center justify-center text-slate-500"
            >
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-border bg-neutral-surface shadow-sm">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-slate-200">No document selected</h3>
                <p className="max-w-sm text-sm text-slate-400">
                  Select a live document from the sidebar or create a new one to start editing.
                </p>
                <button
                  type="button"
                  onClick={handleCreateDoc}
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <FileText className="h-4 w-4" />
                  Create document
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
