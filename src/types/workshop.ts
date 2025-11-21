import { City } from "./city";
import { UserSearchItem } from "./user";
import { Image } from "./image";
import { Video } from "./video";
import { BaseEvent, BaseEventDetails, Role } from "./event";

// Re-export for convenience
export type { Image, Video };

// Workshop EventDetails - extends BaseEventDetails
export interface WorkshopDetails extends BaseEventDetails {
  startDate: string; // Single date for workshop
}

// Workshop Event - extends BaseEvent, no sections, only video gallery
export interface Workshop extends BaseEvent {
  eventDetails: WorkshopDetails;
  videos: Video[]; // Video gallery at event level only
}

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
