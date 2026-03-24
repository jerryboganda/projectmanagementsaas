"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Folder,
  FolderOpen,
  Megaphone,
  Paintbrush,
  Plus,
  Search,
  Star,
  Terminal,
} from "lucide-react";
import type { DocumentResponse } from "@/lib/api/contracts";
import type { DocFolder } from "@/hooks/use-documents-data";
import { FOLDER_OPTIONS } from "@/hooks/use-documents-data";
import {
  formatDocumentTimestamp,
  getDocumentPreview,
} from "./data";
import { cn } from "@/lib/utils";

interface DocsSidebarProps {
  documents: DocumentResponse[];
  recentDocuments: DocumentResponse[];
  favoritedDocuments: DocumentResponse[];
  selectedDocId: string | null;
  onSelectDoc: (id: string) => void;
  onCreateDoc: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isCreatingDocument: boolean;
  isLoading: boolean;
  visibleCount: number;
  totalCount: number;
  activeFolder: DocFolder | null;
  onFolderChange: (folder: DocFolder | null) => void;
  folderCounts: Record<DocFolder, number>;
  favorites: Set<string>;
}

const FOLDER_ICONS: Record<DocFolder, ReactNode> = {
  General: <Folder className="h-4 w-4" />,
  Engineering: <Terminal className="h-4 w-4" />,
  Design: <Paintbrush className="h-4 w-4" />,
  Marketing: <Megaphone className="h-4 w-4" />,
  Archive: <Archive className="h-4 w-4" />,
};

const FOLDER_ICONS_OPEN: Record<DocFolder, ReactNode> = {
  General: <FolderOpen className="h-4 w-4" />,
  Engineering: <Terminal className="h-4 w-4" />,
  Design: <Paintbrush className="h-4 w-4" />,
  Marketing: <Megaphone className="h-4 w-4" />,
  Archive: <Archive className="h-4 w-4" />,
};

function DocItem({
  document,
  isSelected,
  isFavorite,
  onSelect,
}: {
  document: DocumentResponse;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-[calc(100%-1rem)] mx-2 flex items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
      )}
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-border/70 bg-neutral-surface text-slate-300">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{document.title}</span>
          {isFavorite && (
            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
          )}
          {document.isPublished && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              Published
            </span>
          )}
        </div>
        <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {getDocumentPreview(document)}
        </div>
        <div className="mt-1 text-[11px] text-slate-600">
          Updated {formatDocumentTimestamp(document.updatedAt)}
        </div>
      </div>
      {isSelected && (
        <motion.div
          layoutId="active-doc-indicator"
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
        />
      )}
    </button>
  );
}

function DocumentsSection({
  title,
  documents,
  selectedDocId,
  onSelectDoc,
  emptyLabel,
  favorites,
}: {
  title: string;
  documents: DocumentResponse[];
  selectedDocId: string | null;
  onSelectDoc: (id: string) => void;
  emptyLabel: string;
  favorites: Set<string>;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-1 px-4 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        {title}
        <span className="ml-auto font-normal normal-case tracking-normal text-slate-600">
          {documents.length}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5">
              {documents.length === 0 ? (
                <div className="mx-4 rounded-lg border border-dashed border-neutral-border/60 bg-white/2 px-3 py-3 text-sm text-slate-500">
                  {emptyLabel}
                </div>
              ) : (
                documents.map((document) => (
                  <DocItem
                    key={document.id}
                    document={document}
                    isSelected={selectedDocId === document.id}
                    isFavorite={favorites.has(document.id)}
                    onSelect={() => onSelectDoc(document.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DocsSidebar({
  documents,
  recentDocuments,
  favoritedDocuments,
  selectedDocId,
  onSelectDoc,
  onCreateDoc,
  searchQuery,
  onSearchChange,
  isCreatingDocument,
  isLoading,
  visibleCount,
  totalCount,
  activeFolder,
  onFolderChange,
  folderCounts,
  favorites,
}: DocsSidebarProps) {
  const isFiltering = searchQuery.trim().length > 0 || activeFolder !== null;
  const [foldersCollapsed, setFoldersCollapsed] = useState(false);

  return (
    <div className="z-10 flex h-full w-72 flex-shrink-0 flex-col border-r border-neutral-border bg-background-dark">
      {/* Header */}
      <div className="border-b border-neutral-border/50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Documentation
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {isLoading ? "Loading…" : `${totalCount} document${totalCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isCreatingDocument}
              onClick={onCreateDoc}
              title="Create a new document"
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isCreatingDocument
                  ? "cursor-not-allowed text-slate-600"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
              )}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-lg border border-neutral-border bg-neutral-surface py-1.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 transition-all focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
          <span>
            {isLoading ? "Loading documents" : `${visibleCount} of ${totalCount} visible`}
          </span>
          {activeFolder && (
            <button
              type="button"
              onClick={() => onFolderChange(null)}
              className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary transition-colors hover:bg-primary/20"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="custom-scrollbar flex-1 overflow-y-auto py-4">
        {/* Favorites section */}
        {favoritedDocuments.length > 0 && (
          <div className="mb-4">
            <div className="px-4 mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-500/80 uppercase tracking-wider">
              <Star className="h-3 w-3 fill-amber-500/80 text-amber-500/80" />
              Favorites
              <span className="ml-auto font-normal normal-case tracking-normal text-slate-600">
                {favoritedDocuments.length}
              </span>
            </div>
            <div className="space-y-0.5">
              {favoritedDocuments.map((document) => (
                <DocItem
                  key={document.id}
                  document={document}
                  isSelected={selectedDocId === document.id}
                  isFavorite
                  onSelect={() => onSelectDoc(document.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Views */}
        <div className="mb-4">
          <div className="px-4 mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Quick Views
          </div>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => onFolderChange(null)}
              className={cn(
                "mx-2 flex w-[calc(100%-1rem)] items-center rounded-md px-4 py-1.5 text-sm transition-colors",
                activeFolder === null && !searchQuery
                  ? "bg-white/5 text-slate-200"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
              )}
            >
              <Clock className="mr-3 h-4 w-4 text-slate-400" />
              <span className="flex-1 text-left">Recent</span>
            </button>
            <button
              type="button"
              onClick={() => onFolderChange(null)}
              className="mx-2 flex w-[calc(100%-1rem)] items-center rounded-md px-4 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
            >
              <Star className="mr-3 h-4 w-4 text-slate-400" />
              <span className="flex-1 text-left">Favorites</span>
              {favoritedDocuments.length > 0 && (
                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  {favoritedDocuments.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Folder tree */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setFoldersCollapsed((c) => !c)}
            className="flex w-full items-center gap-1 px-4 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
          >
            {foldersCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            Folders
          </button>
          <AnimatePresence initial={false}>
            {!foldersCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5">
                  {FOLDER_OPTIONS.map((folder) => {
                    const isActive = activeFolder === folder;
                    const count = folderCounts[folder] ?? 0;
                    return (
                      <button
                        key={folder}
                        type="button"
                        onClick={() => onFolderChange(isActive ? null : folder)}
                        className={cn(
                          "mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                        )}
                      >
                        <span className={isActive ? "text-primary" : "text-slate-500"}>
                          {isActive ? FOLDER_ICONS_OPEN[folder] : FOLDER_ICONS[folder]}
                        </span>
                        <span className="flex-1 text-left">{folder}</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                            isActive
                              ? "bg-primary/20 text-primary"
                              : "bg-white/5 text-slate-500",
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Document lists */}
        {isFiltering ? (
          <DocumentsSection
            title={activeFolder ? `${activeFolder} folder` : "Search results"}
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDoc={onSelectDoc}
            emptyLabel={
              activeFolder
                ? `No documents in ${activeFolder} folder.`
                : "No documents match the current search."
            }
            favorites={favorites}
          />
        ) : (
          <>
            <DocumentsSection
              title="Recent"
              documents={recentDocuments}
              selectedDocId={selectedDocId}
              onSelectDoc={onSelectDoc}
              emptyLabel="No recently updated documents yet."
              favorites={favorites}
            />
            <DocumentsSection
              title="All documents"
              documents={documents}
              selectedDocId={selectedDocId}
              onSelectDoc={onSelectDoc}
              emptyLabel="No documents in this workspace yet."
              favorites={favorites}
            />
          </>
        )}
      </div>
    </div>
  );
}
