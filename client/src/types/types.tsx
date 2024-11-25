// Party Interfaces
export interface PartyCard {
  title: string;
  image: string;
  date: number;
  address: string;
  cost: string;
  dj: string[];
}

export interface PartiesSection {
  type: string;
  partyCards: PartyCard[];
}

// Performance Interfaces
export interface PerformanceCard {
  title: string;
  src: string;
  dancers: string[];
}

export interface PerformancesSection {
  type: string;
  performanceCards: PerformanceCard[];
}

// Workshop Interfaces
export interface WorkshopCard {
  title: string;
  images: string[];
  date: number;
  address: string;
  cost: string;
  styles: string[];
  teacher: string[];
  recapSrc: string;
}

export interface WorkshopsSection {
  type: string;
  workshopCards: WorkshopCard[];
}

// Battle Interfaces
export interface BattleCard {
  title: string;
  src: string;
  teams:
    | {
        name: string;
        members: string[];
        winner: boolean;
      }[]
    | [];
  dancers: string[];
}

export interface Bracket {
  type: string;
  battleCards: BattleCard[];
}

export interface BattlesSection {
  type: string;
  format: string;
  styles: string[];
  judges: string[];
  brackets: Bracket[];
}
