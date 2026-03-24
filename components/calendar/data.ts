export type CalendarItemType = "Event" | "Milestone" | "Deadline" | "Meeting" | "Reminder";

export interface CalendarProject {
  id: string;
  name: string;
  color?: string | null;
}

export interface CalendarItem {
  id: string;
  title: string;
  description?: string;
  type: CalendarItemType;
  color?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  recurrenceRule?: string;
  linkedTaskId?: string;
  linkedProjectId?: string;
  creator?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarItemInput {
  title: string;
  description?: string;
  type: CalendarItemType;
  color?: string;
  startTime: string | Date;
  endTime: string | Date;
  isAllDay?: boolean;
  recurrenceRule?: string;
  linkedTaskId?: string;
  linkedProjectId?: string;
}

export type UpdateCalendarItemInput = CreateCalendarItemInput;

export const CALENDAR_ITEM_TYPES: { value: CalendarItemType; label: string }[] = [
  { value: "Event", label: "Event" },
  { value: "Meeting", label: "Meeting" },
  { value: "Milestone", label: "Milestone" },
  { value: "Deadline", label: "Deadline" },
  { value: "Reminder", label: "Reminder" },
];
