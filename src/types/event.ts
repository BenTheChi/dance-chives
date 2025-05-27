import { City } from "./city";

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
}

export interface Event extends NewEvent {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Role {
  title: string;
  user: {
    id: string;
    displayName: string;
  };
}
