import { City } from "./city";
import { UserSearchItem } from "./user";
import { Image } from "./image";
import { Video } from "./video";

// Base EventDetails interface - common properties for all event types
export interface BaseEventDetails {
  title: string;
  description?: string;
  schedule?: string;
  address?: string; // location
  startTime?: string;
  endTime?: string;
  creatorId: string;
  cost?: string;
  poster?: Image | null;
  city: City;
  styles?: string[]; // danceStyleTags
}

// Competition EventDetails - has startDate (single date), prize, entryCost
export interface CompetitionDetails extends BaseEventDetails {
  startDate: string; // Single date for competition
  prize?: string;
  entryCost?: string;
}

// Workshop EventDetails - has startDate (single date)
export interface WorkshopDetails extends BaseEventDetails {
  startDate: string; // Single date for workshop
}

// Session EventDetails - has dates array for recurrence
export interface SessionDetails extends BaseEventDetails {
  dates: SessionDate[]; // Array of dates for recurring sessions
}

export interface SessionDate {
  date: string;
  startTime: string;
  endTime: string;
}

// Base Event interface - common properties for all event types
export interface BaseEvent {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
  gallery: Image[]; // photoGallery
  subEvents?: BaseEvent[]; // Subevents are now relationships to other events
}

// Competition Event - has sections with winners and brackets
export interface Competition extends BaseEvent {
  eventDetails: CompetitionDetails;
  sections: Section[];
  // No videos at event level - videos are in sections/brackets
  // Workshops are now separate Event:Workshop nodes, not nested
}

// Workshop Event - no sections, only video gallery at event level
export interface Workshop extends BaseEvent {
  eventDetails: WorkshopDetails;
  videos: Video[]; // Video gallery at event level only
}

// Session Event - no sections/brackets, has dates array, has video gallery at event level
export interface Session extends BaseEvent {
  eventDetails: SessionDetails;
  videos: Video[]; // Video gallery at event level
  // No sections or brackets
}

// Role interface - common across all event types
export interface Role {
  id: string;
  title: string;
  user: UserSearchItem | null;
}

// Section for Competitions - has brackets and winners
export interface Section {
  id: string;
  title: string;
  description?: string;
  hasBrackets: boolean;
  videos: Video[];
  brackets: Bracket[];
  styles?: string[];
  applyStylesToVideos?: boolean;
  applyVideoTypeToVideos?: boolean; // New: apply video type to all videos in section
  winners?: UserSearchItem[];
}

// Section for Workshops - no brackets, no winners
export interface WorkshopSection {
  id: string;
  title: string;
  description?: string;
  videos: Video[];
  styles?: string[];
  applyStylesToVideos?: boolean;
  applyVideoTypeToVideos?: boolean; // New: apply video type to all videos in section
  // No brackets, no winners
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
