import { City } from "./city";
import { UserSearchItem } from "./user";
import { Workshop } from "./workshop";

export interface EventDetails {
  title: string;
  startDate: string;
  description?: string;
  schedule?: string;
  address?: string;
  startTime?: string;
  endTime?: string;
  creatorId: string;
  prize?: string;
  entryCost?: string;
  poster?: Picture | null;
  city: City;
}

export interface Event {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  eventDetails: EventDetails;
  roles: Role[];
  sections: Section[];
  subEvents: SubEvent[];
  workshops: Workshop[];
  gallery: Picture[];
}

export interface SubEvent {
  id: string;
  title: string;
  description?: string;
  schedule?: string;
  startDate: string;
  address?: string;
  startTime?: string;
  endTime?: string;
  poster?: Picture | null;
}

export interface Role {
  id: string;
  title: string;
  user: UserSearchItem | null;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  hasBrackets: boolean;
  videos: Video[];
  brackets: Bracket[];
  styles?: string[];
  applyStylesToVideos?: boolean;
  winners?: UserSearchItem[];
}

export interface Bracket {
  id: string;
  title: string;
  videos: Video[];
}

export interface Video {
  id: string;
  title: string;
  src: string;
  taggedWinners?: UserSearchItem[];
  taggedDancers?: UserSearchItem[];
  styles?: string[];
}

export interface Picture {
  id: string;
  title: string;
  url: string;
  type: string;
  file: File | null;
}

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
