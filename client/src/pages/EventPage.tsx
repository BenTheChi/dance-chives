import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { EventProvider } from '@/components/Providers/EventProvider';
import { getEvent } from '@/gql/returnQueries';
import { IEvent, UserBasicInfo } from '@/types/types';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Event } from '../components/Event';

interface GQLEvent {
  uuid: string;
  title: string;
  date: number;
  description: string;
  address: string;
  addressName: string;
  cost: string;
  images: string[];
  prizes: string;
  promoVideo: string;
  recapVideo: string;
  organizers: UserBasicInfo[];
  mcs: UserBasicInfo[];
  djs: UserBasicInfo[];
  videographers: UserBasicInfo[];
  graphicDesigners: UserBasicInfo[];
  photographers: UserBasicInfo[];
  inCity: {
    name: string;
    state: string;
    country: string;
  };
  styles: {
    name: string;
  }[];
  battleSections: {
    order: number;
    uuid: string;
    type: 'battles';
    format: string;
    judges: UserBasicInfo[];
    styles: {
      name: string;
    }[];
    brackets: {
      uuid: string;
      type: string;
      order: string;
      battleCards: {
        order: string;
        uuid: string;
        title: string;
        src: string;
        dancers: UserBasicInfo[];
        winners: UserBasicInfo[];
      }[];
    }[];
  }[];
  performanceSections: {
    order: number;
    uuid: string;
    type: 'performances';
    performanceCardsIn: {
      order: string;
      uuid: string;
      title: string;
      src: string;
      dancers: UserBasicInfo[];
    }[];
  }[];
  workshopSections: {
    order: number;
    uuid: string;
    type: 'workshops';
    workshopCardsIn: {
      order: string;
      uuid: string;
      title: string;
      cost: string;
      date: number;
      address: string;
      image: string;
      recapSrc: string;
      styles: {
        name: string;
      }[];
      teachers: UserBasicInfo[];
    }[];
  }[];
}

export function EventPage() {
  const { id } = useParams();

  function convertGQL(event: GQLEvent) {
    let battleSections = event.battleSections.map((section) => ({
      order: section.order,
      isEditable: false,
      uuid: section.uuid,
      type: section.type as 'battles',
      format: section.format,
      styles: section.styles.map((style) => style.name),
      judges: section.judges,
      brackets: section.brackets
        .map((bracket) => ({
          uuid: bracket.uuid,
          type: bracket.type,
          order: Number(bracket.order),
          battleCards: bracket.battleCards.map((battleCard) => ({
            order: Number(battleCard.order),
            uuid: battleCard.uuid,
            isEditable: false,
            title: battleCard.title,
            src: battleCard.src,
            dancers: battleCard.dancers,
            winners: battleCard.winners,
          })),
        }))
        .toSorted((a, b) => a.order - b.order),
    }));

    let workshopSections = event.workshopSections.map((section) => ({
      order: section.order,
      uuid: section.uuid,
      type: section.type as 'workshops',
      workshopCards: section.workshopCardsIn.map((workshopCard) => ({
        order: Number(workshopCard.order),
        uuid: workshopCard.uuid,
        isEditable: false,
        title: workshopCard.title,
        image: workshopCard.image,
        date: workshopCard.date,
        address: workshopCard.address,
        cost: workshopCard.cost,
        recapSrc: workshopCard.recapSrc,
        styles: workshopCard.styles.map((style) => style.name),
        teachers: workshopCard.teachers,
      })),
    }));

    let performanceSections = event.performanceSections.map((section) => ({
      order: section.order,
      uuid: section.uuid,
      type: section.type as 'performances',
      performanceCards: section.performanceCardsIn.map((performanceCard) => ({
        order: Number(performanceCard.order),
        uuid: performanceCard.uuid,
        isEditable: false,
        title: performanceCard.title,
        src: performanceCard.src,
        dancers: performanceCard.dancers,
      })),
    }));

    return {
      uuid: event.uuid,
      title: event.title,
      date: event.date,
      city: event.inCity.name,
      styles: event.styles.map((style) => style.name),
      addressName: event.addressName,
      address: event.address,
      description: event.description,
      images: event.images,
      prizes: event.prizes,
      cost: event.cost,
      organizers: event.organizers,
      mcs: event.mcs,
      djs: event.djs,
      videographers: event.videographers,
      graphicDesigners: event.graphicDesigners,
      photographers: event.photographers,
      promoVideo: event.promoVideo,
      recapVideo: event.recapVideo,
      sections: [...battleSections, ...workshopSections, ...performanceSections].sort(
        (a, b) => a.order - b.order
      ),
    };
  }

  let eventData: IEvent | undefined;
  const { loading, data } = useQuery(getEvent(id || ''));

  if (!loading) {
    eventData = convertGQL(data.events[0]);
    console.log('SUCCESSFUL GET EVENT');
    console.log(eventData);
  }

  if (loading || !eventData) {
    return <div>Loading...</div>;
  }

  return (
    <BasicAppShell>
      <DarkModeToggle />
      <EventProvider initialEventData={eventData}>
        <Event />
      </EventProvider>
    </BasicAppShell>
  );
}
