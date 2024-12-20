export interface IUser {
  uid: number;
  firstName: string;
  lastName: string;
  userName: string;
  dob: number;
  city: string;
  auth: string;
  styles: string[];
  createdEvents: string[];
}

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
  image: string;
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
  dancers: string[];
  winners: string[];
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

export type ISection = IBattlesSection | IPartiesSection | IPerformancesSection | IWorkshopsSection;

export interface TallCardProps {
  title: string;
  date: number;
  city: string;
  styles: string[];
  cardType: string;
}

export interface IEvent {
  id: string;
  title: string;
  date: number;
  city: string;
  styles: string[];
  addressName: string;
  address: string;
  description: string;
  images: string[];
  prizes: string;
  cost: string;
  organizers: string[];
  mcs: string[];
  djs: string[];
  videographers: string[];
  photographers: string[];
  promoVideo: string;
  recapVideo: string;
  sections: ISection[];
}

export interface EventContextType {
  eventData: IEvent;
}
