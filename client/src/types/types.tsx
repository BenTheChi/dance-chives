export interface UserBasicInfo {
  username: string;
  displayName: string;
}

export interface ICity {
  name: string;
  country: string;
}

export interface IUser {
  uuid: string;
  displayName: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  dob: number;
  createdAt: number;
  aboutme?: string;
  image?: string;
  socials?: string[];
  auth: string;
  styles?: string[];
  city: ICity;
}

// uuid: String! @unique
// displayName: String! @unique
// email: String! @unique
// fname: String!
// lname: String!
// dob: BigInt!
// createdAt: BigInt!
// auth: String!
// aboutme: String
// image: String
// socials: [String!]
// city: City! @relationship(type: "LIVES_IN", direction: OUT)
// winnerOf: [BattleCard!]! @relationship(type: "WINNER_OF", direction: OUT)
// dancesInBattleCards: [BattleCard!]!
//   @relationship(type: "DANCES_IN", direction: OUT)
// dancesInPerformanceCards: [PerformanceCard!]!
//   @relationship(type: "DANCES_IN", direction: OUT)
// organizes: [Event!]! @relationship(type: "ORGANIZES", direction: OUT)
// mcs: [Event!]! @relationship(type: "MCS", direction: OUT)
// djs: [Event!]! @relationship(type: "DJS", direction: OUT)
// videographs: [Event!]! @relationship(type: "VIDEOGRAPHS", direction: OUT)
// photographs: [Event!]! @relationship(type: "PHOTOGRAPHS", direction: OUT)
// judges: [Section!]! @relationship(type: "JUDGES", direction: OUT)
// graphicDesigns: [Event!]!
//   @relationship(type: "GRAPHIC_DESIGNS", direction: OUT)
// teachesInWorkshopCards: [WorkshopCard!]!
//   @relationship(type: "TEACHES_IN", direction: OUT)

// Party Interfaces
export interface IPartyCard {
  order: number;
  uuid: string;
  title: string;
  image: string;
  date: number;
  address: string;
  cost: string;
  dj: UserBasicInfo[];
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
  dancers: UserBasicInfo[];
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
  teachers: UserBasicInfo[];
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
  dancers: UserBasicInfo[];
  winners: UserBasicInfo[];
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
  judges: UserBasicInfo[];
  brackets: IBracket[];
  isEditable: boolean;
}

export type ISection = IBattlesSection | IPartiesSection | IPerformancesSection | IWorkshopsSection;

export interface EventCardProps {
  title: string;
  date: number;
  city: ICity;
  styles: string[];
  images: string[];
}

export interface IEventCard {
  uuid: string;
  title: string;
  date: number;
  city: ICity;
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
  city: ICity;
  styles: string[];
  addressName: string;
  address: string;
  description: string;
  images: string[];
  prizes: string;
  cost: string;
  organizers: UserBasicInfo[];
  mcs: UserBasicInfo[];
  djs: UserBasicInfo[];
  videographers: UserBasicInfo[];
  photographers: UserBasicInfo[];
  promoVideo: string;
  recapVideo: string;
  sections: ISection[];
}

export interface EventContextType {
  eventData: IEvent;
}
