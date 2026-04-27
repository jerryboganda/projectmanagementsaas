import type { ApiUserBrief } from "./common";

export interface DocumentResponse {
  id: string;
  workspaceId: string;
  title: string;
  content?: string | null;
  contentFormat: string;
  projectId?: string | null;
  parentDocumentId?: string | null;
  creator: ApiUserBrief;
  isPublished: boolean;
  publishedAt?: string | null;
  sortOrder: number;
  childDocuments?: DocumentResponse[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequest {
  title: string;
  content?: string | null;
  contentFormat?: string | null;
  projectId?: string | null;
  parentDocumentId?: string | null;
  isPublished?: boolean | null;
  sortOrder?: number | null;
}

export interface UpdateDocumentRequest {
  title: string;
  content?: string | null;
  contentFormat?: string | null;
  projectId?: string | null;
  parentDocumentId?: string | null;
  isPublished?: boolean | null;
  sortOrder?: number | null;
}
