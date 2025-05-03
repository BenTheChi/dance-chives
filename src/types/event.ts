import { Image } from "./media";

export interface NewEvent {
  creatorId: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  address: string | null;
  time: string | null;
  roles: Role[] | null;
  poster: Image | null;
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
