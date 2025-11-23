import { City } from "./city";
import { UserSearchItem } from "./user";
import { Image } from "./image";
import { Video } from "./video";
import { Event, EventDetails, Role } from "./event";

// Re-export for convenience
export type { Image, Video };

// Legacy types - kept for backward compatibility
// All events now use Event and EventDetails
export type WorkshopDetails = EventDetails;
export type Workshop = Event;

// WorkshopRole - same as Role but kept for backward compatibility
export interface WorkshopRole extends Role {
  title: "ORGANIZER" | "TEACHER" | "TEAM_MEMBER";
}

export interface WorkshopCard {
  id: string;
  title: string;
  imageUrl?: string;
  date: string;
  city: string;
  cityId?: number;
  cost?: string;
  styles?: string[];
}
