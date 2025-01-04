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
  order: number;
  uuid: string;
  title: string;
  image: string;
  date: number;
  address: string;
  cost: string;
  dj: string[];
  isEditable: boolean;
}

export interface IPartiesSection {
  order: number;
  uuid: string;
  type: 'parties';
  partyCards: IPartyCard[];
}

// Performance Interfaces
export interface IPerformanceCard {
  order: number;
  uuid: string;
  title: string;
  src: string;
  dancers: string[];
  isEditable: boolean;
}

export interface IPerformancesSection {
  order: number;
  uuid: string;
  type: 'performances';
  performanceCards: IPerformanceCard[];
}

// Workshop Interfaces
export interface IWorkshopCard {
  order: number;
  uuid: string;
  title: string;
  image: string;
  date: number;
  address: string;
  cost: string;
  styles: string[];
  teachers: string[];
  recapSrc: string;
  isEditable: boolean;
}

export interface IWorkshopsSection {
  order: number;
  uuid: string;
  type: 'workshops';
  workshopCards: IWorkshopCard[];
}

export interface IBattleCard {
  order: number;
  uuid: string;
  title: string;
  src: string;
  dancers: string[];
  winners: string[];
  isEditable: boolean;
}

export interface IBracket {
  uuid: string;
  type: string;
  order: number;
  battleCards: IBattleCard[];
}

export interface IBattlesSection {
  order: number;
  uuid: string;
  type: 'battles';
  format: string;
  styles: string[];
  judges: string[];
  brackets: IBracket[];
  isEditable: boolean;
}

export type ISection = IBattlesSection | IPartiesSection | IPerformancesSection | IWorkshopsSection;

export interface EventCardProps {
  title: string;
  date: number;
  city: string;
  styles: string[];
  images: string[];
}

export interface IEventCard {
  uuid: string;
  title: string;
  date: number;
  city: string;
  styles: string[];
  hasBattle: boolean;
  hasParty: boolean;
  hasWorkshop: boolean;
  hasPerformance: boolean;
  images: string[];
}

export interface IEventCards {
  events: IEventCard[];
}

export interface IEvent {
  uuid: string;
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
