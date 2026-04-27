import type { ApiUserBrief } from "./common";

export interface NotificationResponse {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actor?: ApiUserBrief | null;
  isRead: boolean;
  readAt?: string | null;
  isArchived: boolean;
  createdAt: string;
}

export interface NotificationPreferenceResponse {
  id: string;
  eventType: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export interface NotificationPreferenceItem {
  eventType: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  preferences: NotificationPreferenceItem[];
}

export interface MarkAllReadResponse {
  updatedCount: number;
}
