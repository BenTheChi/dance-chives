import { City } from "./city";
import { UserSearchItem } from "./user";

export interface NewEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  address?: string;
  time?: string;
  creatorId: string;
  poster?: {
    id: string;
    title: string;
    src: string;
    type: string;
  };
  city: City;
  roles?: Role[];
}

export interface Event extends NewEvent {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  role: string;
  user: UserSearchItem;
}
