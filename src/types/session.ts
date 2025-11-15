import { City } from "./city";
import { UserSearchItem } from "./user";
import { Picture, Video } from "./event";

// Re-export Picture and Video for convenience
export type { Picture, Video };

export interface SessionDate {
  date: string;
  startTime: string;
  endTime: string;
}

export interface SessionDetails {
  title: string;
  dates: SessionDate[];
  description?: string;
  schedule?: string;
  address?: string;
  creatorId: string;
  cost?: string;
  poster?: Picture | null;
  city: City;
  styles?: string[];
}

export interface Session {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  sessionDetails: SessionDetails;
  roles: SessionRole[];
  videos: Video[];
  gallery: Picture[];
}

export interface SessionRole {
  id: string;
  title: string; // Uses Event roles (AVAILABLE_ROLES)
  user: UserSearchItem | null;
}

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

