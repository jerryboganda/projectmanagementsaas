import type { ApiUserBrief } from "./common";

export type CalendarItemType =
  | "Event"
  | "Milestone"
  | "Deadline"
  | "Meeting"
  | "Reminder"
  | number;

export interface CalendarItemResponse {
  id: string;
  title: string;
  description?: string | null;
  type: CalendarItemType;
  color?: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  recurrenceRule?: string | null;
  linkedTaskId?: string | null;
  linkedProjectId?: string | null;
  creator: ApiUserBrief;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarItemRequest {
  title: string;
  description?: string | null;
  type: CalendarItemType;
  color?: string | null;
  startTime: string;
  endTime: string;
  isAllDay?: boolean | null;
  recurrenceRule?: string | null;
  linkedTaskId?: string | null;
  linkedProjectId?: string | null;
}

export interface UpdateCalendarItemRequest {
  title: string;
  description?: string | null;
  type: CalendarItemType;
  color?: string | null;
  startTime: string;
  endTime: string;
  isAllDay?: boolean | null;
  recurrenceRule?: string | null;
  linkedTaskId?: string | null;
  linkedProjectId?: string | null;
}
