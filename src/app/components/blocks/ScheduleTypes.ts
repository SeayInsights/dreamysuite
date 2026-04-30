// Shared types for ScheduleBlock and its sub-components

export interface ScheduleEvent {
  id: string;
  name?: string;
  date?: string;
  time?: string;
  endTime?: string;
  location?: string;
  description?: string;
  dressCode?: string;
  icon?: string;
  mapsUrl?: string;
}

export interface Block { id: string; type: string; [key: string]: unknown }

export type PopoverType = "emoji" | "date" | "time" | "endTime" | "mapsUrl";

export interface PopoverState {
  type: PopoverType;
  eventId: string;
  rect: DOMRect;
}
