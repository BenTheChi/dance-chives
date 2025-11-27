import { City } from "./city";
import { UserSearchItem } from "./user";
import { Image } from "./image";
import { Video } from "./video";

// Re-export Video for convenience
export type { Video } from "./video";

// Event type labels for categorization (stored as Neo4j labels, not properties)
export type EventType =
  | "Battle"
  | "Competition"
  | "Class"
  | "Workshop"
  | "Session"
  | "Party"
  | "Festival"
  | "Performance"
  | "Other";

export interface EventDate {
  date: string;
  startTime: string;
  endTime: string;
}

// EventDetails interface - unified properties for all event types
export interface EventDetails {
  title: string;
  description?: string;
  schedule?: string;
  address?: string; // location
  creatorId: string;
  cost?: string;
  prize?: string; // Prize information (can be used by any event type)
  entryCost?: string; // Entry cost (can be used by any event type)
  dates: EventDate[]; // Required: Array of dates for events (at least one)
  poster?: Image | null;
  city: City;
  styles?: string[]; // danceStyleTags
  eventType: EventType;
}

// Event interface - unified event structure for all event types
export interface Event {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  eventDetails: EventDetails;
  roles: Role[];
  gallery: Image[]; // photoGallery
  sections: Section[]; // Sections available for all event types
}

// Role interface - common across all event types
export interface Role {
  id: string;
  title: string;
  user: UserSearchItem | null;
}

// Section - universal for all event types
// Brackets and winners are optional and depend on section type
export interface Section {
  id: string;
  title: string;
  description?: string;
  sectionType:
    | "Battle"
    | "Tournament"
    | "Competition"
    | "Performance"
    | "Showcase"
    | "Class"
    | "Session"
    | "Mixed"
    | "Other"; // Section type stored as Neo4j label
  hasBrackets: boolean; // Whether this section uses brackets (auto-set based on section type)
  videos: Video[]; // Direct videos in section (when hasBrackets is false)
  brackets: Bracket[]; // Brackets in section (when hasBrackets is true)
  styles?: string[];
  applyStylesToVideos?: boolean;
  applyVideoTypeToVideos?: boolean; // Apply video type to all videos in section
  winners?: UserSearchItem[]; // Section winners (optional, depends on section type)
  poster?: Image | null;
}

export interface Bracket {
  id: string;
  title: string;
  videos: Video[];
}

// EventCard for display purposes
export interface EventCard {
  id: string;
  title: string;
  series?: string;
  imageUrl?: string;
  date: string;
  city: string;
  cityId?: number;
  styles: string[];
}
