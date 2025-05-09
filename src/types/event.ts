import { Image } from "./media";

export interface CityInput {
  name: string;
  country: string;
  timezone: string;
}

export interface NewEvent {
  title: string;
  startDate: string;
  endDate: string;
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
  city: CityInput; 
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
