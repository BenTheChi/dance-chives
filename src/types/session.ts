import { City } from "./city";
import { UserSearchItem } from "./user";
import { Image } from "./image";
import { Video } from "./video";
import { Event, EventDetails, Role, SessionDate } from "./event";

// Re-export for convenience
export type { Image, Video };

// Legacy types - kept for backward compatibility
// All events now use Event and EventDetails
export type SessionDetails = EventDetails;
export type Session = Event;

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

