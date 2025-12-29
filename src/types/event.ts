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
  startTime?: string;
  endTime?: string;
}

// EventDetails interface - unified properties for all event types
export interface EventDetails {
  title: string;
  description?: string;
  schedule?: string;
  location?: string;
  creatorId: string;
  cost?: string;
  prize?: string;
  dates: EventDate[]; // Required: Array of dates for events (at least one)
  poster?: Image | null;
  originalPoster?: Image | null;
  bgColor?: string; // Form-only field for poster background color
  city: City;
  styles?: string[]; // danceStyleTags
  eventType: EventType;
  status?: "hidden" | "visible"; // Event visibility status
  website?: string;
  instagram?: string;
  youtube?: string;
  facebook?: string;
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
  judges?: UserSearchItem[]; // Section judges (optional, depends on section type)
  bgColor?: string; // Form-only background color for poster thumbnail
  poster?: Image | null;
}

export interface Bracket {
  id: string;
  title: string;
  videos: Video[];
}

// TEventCard for display purposes
export interface TEventCard {
  id: string;
  title: string;
  series?: string;
  imageUrl?: string;
  date: string;
  city: string;
  cityId?: string;
  styles: string[];
  eventType?: EventType;
  additionalDatesCount?: number; // Number of additional dates beyond the first one
  status?: "hidden" | "visible"; // Event visibility status
}
