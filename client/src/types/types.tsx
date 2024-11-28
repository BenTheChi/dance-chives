// Party Interfaces
export interface IPartyCard {
  title: string;
  image: string;
  date: number;
  address: string;
  cost: string;
  dj: string[];
}

export interface IPartiesSection {
  type: 'parties';
  partyCards: IPartyCard[];
}

// Performance Interfaces
export interface IPerformanceCard {
  title: string;
  src: string;
  dancers: string[];
}

export interface IPerformancesSection {
  type: 'performances';
  performanceCards: IPerformanceCard[];
}

// Workshop Interfaces
export interface IWorkshopCard {
  title: string;
  images: string[];
  date: number;
  address: string;
  cost: string;
  styles: string[];
  teacher: string[];
  recapSrc: string;
}

export interface IWorkshopsSection {
  type: 'workshops';
  workshopCards: IWorkshopCard[];
}

export interface IBattleCard {
  title: string;
  src: string;
  teams: {
    name: string;
    members: string[];
    winner: boolean;
  }[];
  dancers: string[];
}

export interface IBracket {
  type: string;
  battleCards: IBattleCard[];
}

export interface IBattlesSection {
  type: 'battles';
  format: string;
  styles: string[];
  judges: string[];
  brackets: IBracket[];
}

export interface IWorkshopCard {
  title: string;
  images: string[];
  date: number;
  address: string;
  cost: string;
  styles: string[];
  teacher: string[];
  recapSrc: string;
}

export type ISection = IBattlesSection | IPartiesSection | IPerformancesSection | IWorkshopsSection;
