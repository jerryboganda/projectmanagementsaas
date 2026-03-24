"use client";

import { type NotificationResponse } from "@/lib/api/contracts";
import { format, isToday, isYesterday } from "date-fns";

export type InboxItemType = "mention" | "assignment" | "comment" | "status" | "alert";

export interface InboxItem {
  id: string;
  type: InboxItemType;
  title: string;
  description: string;
  actor: {
    name: string;
    avatar?: string | null;
    initials: string;
  };
  entityLabel?: string | null;
  entityId?: string | null;
  timestamp: string;
  dateGroup: "Today" | "Yesterday" | "Older";
  unread: boolean;
  priority?: "Urgent" | "High" | "Medium" | "Low";
  saved?: boolean;
  done?: boolean;
}

function toInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

function humanizeToken(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (segment) => segment.toUpperCase());
}

function toItemType(notificationType: string): InboxItemType {
  const normalized = notificationType.toLowerCase();

  if (normalized.includes("mention")) {
    return "mention";
  }

  if (normalized.includes("assign")) {
    return "assignment";
  }

  if (normalized.includes("comment")) {
    return "comment";
  }

  if (normalized.includes("status")) {
    return "status";
  }

  return "alert";
}

function toPriority(itemType: InboxItemType, title: string) {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes("failed") || normalizedTitle.includes("urgent")) {
    return "Urgent" as const;
  }

  if (itemType === "assignment" || itemType === "mention") {
    return "High" as const;
  }

  if (itemType === "comment" || itemType === "status") {
    return "Medium" as const;
  }

  return "Low" as const;
}

function toDateGroup(date: Date): InboxItem["dateGroup"] {
  if (isToday(date)) {
    return "Today";
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  return "Older";
}

function toTimestamp(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  return format(date, "MMM d");
}

export function toInboxItem(notification: NotificationResponse): InboxItem {
  const createdAt = new Date(notification.createdAt);
  const actorName = notification.actor?.fullName?.trim() || "System";
  const itemType = toItemType(notification.type);

  return {
    id: notification.id,
    type: itemType,
    title: notification.title,
    description: notification.body?.trim() || "No additional details were provided.",
    actor: {
      name: actorName,
      avatar: notification.actor?.avatarUrl ?? null,
      initials: toInitials(actorName) || "LP",
    },
    entityLabel: notification.entityType ? humanizeToken(notification.entityType) : null,
    entityId: notification.entityId ?? null,
    timestamp: toTimestamp(createdAt),
    dateGroup: toDateGroup(createdAt),
    unread: !notification.isRead,
    priority: toPriority(itemType, notification.title),
  };
}
