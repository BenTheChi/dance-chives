import { City } from "./city";
import { UserSearchItem } from "./user";
import { Picture, Video } from "./event";

// Re-export Picture and Video for convenience
export type { Picture, Video };

export interface WorkshopDetails {
  title: string;
  startDate: string;
  description?: string;
  schedule?: string;
  address?: string;
  startTime?: string;
  endTime?: string;
  creatorId: string;
  cost?: string;
  poster?: Picture | null;
  city: City;
}

export interface Workshop {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  workshopDetails: WorkshopDetails;
  roles: WorkshopRole[];
  videos: Video[];
  gallery: Picture[];
  associatedEventId?: string; // Event ID if workshop is associated with an event
}

export interface WorkshopRole {
  id: string;
  title: "ORGANIZER" | "TEACHER" | "TEAM_MEMBER";
  user: UserSearchItem | null;
}

export interface WorkshopCard {
  id: string;
  title: string;
  imageUrl?: string;
  date: string;
  city: string;
  cityId?: number;
  cost?: string;
}
