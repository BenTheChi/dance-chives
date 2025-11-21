import { City } from "./city";
import { UserSearchItem } from "./user";
import { Image } from "./image";
import { Video } from "./video";
import { BaseEvent, BaseEventDetails, Role } from "./event";

// Re-export for convenience
export type { Image, Video };

export interface SessionDate {
  date: string;
  startTime: string;
  endTime: string;
}

// Session EventDetails - extends BaseEventDetails, has dates array for recurrence
export interface SessionDetails extends BaseEventDetails {
  dates: SessionDate[]; // Array of dates for recurring sessions
}

// Session Event - extends BaseEvent, no sections/brackets, has dates array, has video gallery at event level
export interface Session extends BaseEvent {
  eventDetails: SessionDetails;
  videos: Video[]; // Video gallery at event level
}

// SessionRole - same as Role but kept for backward compatibility
export interface SessionRole extends Role {}

export interface SessionCard {
  id: string;
  title: string;
  imageUrl?: string;
  date: string; // First date from dates array
  city: string;
  cityId?: number;
  cost?: string;
  styles?: string[];
}

