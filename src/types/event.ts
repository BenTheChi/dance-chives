import { City } from "./city";
import { UserSearchItem } from "./user";

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
  poster: {
    id: string;
    title: string;
    src: string;
    type: string;
  } | null;
  city: City | null;
}

export interface Event {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  eventDetails: EventDetails;
  roles: Role[];
  sections: Section[];
  subEvents: SubEvent[];
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
  poster: {
    id: string;
    title: string;
    src: string;
    type: string;
  } | null;
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
  hasBrackets?: boolean;
  videos: Video[];
  brackets: Bracket[];
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
  taggedUsers?: UserSearchItem[];
}
