import type { CreateDocumentRequest, DocumentResponse, UpdateDocumentRequest } from "@/lib/api/contracts";

export type DocsDocument = DocumentResponse;

export const DOCUMENTS_FEATURES = {
  folders: false,
  favorites: false,
  collaborators: false,
  sharing: false,
  history: false,
} as const;

function normalizeText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function toDocumentSearchText(document: DocumentResponse) {
  return [document.title, document.content, document.creator.fullName]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchesDocumentSearch(document: DocumentResponse, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return toDocumentSearchText(document).includes(normalizedQuery);
}

export function sortDocumentsByUpdatedAt(documents: DocumentResponse[]) {
  return [...documents].sort((left, right) => {
    const updatedDelta = new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    if (updatedDelta !== 0) {
      return updatedDelta;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export function getDocumentPreview(document: DocumentResponse, length = 120) {
  const content = normalizeText(document.content);
  if (!content) {
    return "No content yet.";
  }

  if (content.length <= length) {
    return content;
  }

  return `${content.slice(0, length).trimEnd()}…`;
}

export function formatDocumentTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getDocumentStatusLabel(document: DocumentResponse) {
  return document.isPublished ? "Published" : "Draft";
}

export function getDocumentStatusTone(document: DocumentResponse) {
  return document.isPublished ? "success" : "muted";
}

export function toCreateDocumentRequest(
  input: CreateDocumentRequest,
): CreateDocumentRequest {
  return {
    title: input.title.trim(),
    content: normalizeText(input.content) || null,
    contentFormat: normalizeText(input.contentFormat) || "plain-text",
    projectId: input.projectId ?? null,
    parentDocumentId: input.parentDocumentId ?? null,
    isPublished: input.isPublished ?? false,
    sortOrder: input.sortOrder ?? 0,
  };
}

export function toUpdateDocumentRequest(
  input: UpdateDocumentRequest,
): UpdateDocumentRequest {
  return {
    title: input.title.trim(),
    content: normalizeText(input.content) || null,
    contentFormat: normalizeText(input.contentFormat) || null,
    projectId: input.projectId ?? null,
    parentDocumentId: input.parentDocumentId ?? null,
    isPublished: input.isPublished ?? null,
    sortOrder: input.sortOrder ?? null,
  };
}

export function createUntitledDocumentRequest(): CreateDocumentRequest {
  return {
    title: "Untitled document",
    content: null,
    contentFormat: "plain-text",
    projectId: null,
    parentDocumentId: null,
    isPublished: false,
    sortOrder: 0,
  };
}

export function toEditorContent(value: string | null | undefined) {
  return typeof value === "string" ? value : "";
}
