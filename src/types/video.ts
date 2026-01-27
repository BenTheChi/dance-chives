import { UserSearchItem } from "./user";

// Base Video interface
export interface Video {
  id: string;
  title: string;
  src: string;
  styles?: string[];
  thumbnailUrl?: string;
  type: "battle" | "freestyle" | "choreography" | "class" | "other";
  taggedDancers?: UserSearchItem[];
  taggedWinners?: UserSearchItem[];
  taggedChoreographers?: UserSearchItem[];
  taggedTeachers?: UserSearchItem[];
  position?: number; // 0-based position for ordering
}

// Battle Video - has dancers and winners
export interface BattleVideo extends Video {
  type: "battle";
  taggedDancers?: UserSearchItem[];
  taggedWinners?: UserSearchItem[];
}

// Freestyle Video - only has dancers
export interface FreestyleVideo extends Video {
  type: "freestyle";
  taggedDancers?: UserSearchItem[];
}

// Choreography Video - has choreographers and dancers
export interface ChoreographyVideo extends Video {
  type: "choreography";
  taggedChoreographers?: UserSearchItem[];
  taggedDancers?: UserSearchItem[];
}

// Class Video - has teachers and dancers
export interface ClassVideo extends Video {
  type: "class";
  taggedTeachers?: UserSearchItem[];
  taggedDancers?: UserSearchItem[];
}

// Other Video - allows all potential video tag types
export interface OtherVideo extends Video {
  type: "other";
  taggedDancers?: UserSearchItem[];
  taggedWinners?: UserSearchItem[];
  taggedChoreographers?: UserSearchItem[];
  taggedTeachers?: UserSearchItem[];
}
