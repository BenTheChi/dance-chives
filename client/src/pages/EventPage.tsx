import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { EventProvider } from '@/components/Providers/EventProvider';
import { getEvent } from '@/gql/returnQueries';
import { IEvent } from '@/types/types';
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
  organizers: {
    uuid: string;
    email: string;
    displayName: string;
  }[];
  mcs: {
    uuid: string;
    email: string;
    displayName: string;
  }[];
  djs: {
    uuid: string;
    email: string;
    displayName: string;
  }[];
  videographers: {
    uuid: string;
    email: string;
    displayName: string;
  }[];
  graphicDesigners: {
    uuid: string;
    email: string;
    displayName: string;
  }[];
  photographers: {
    uuid: string;
    email: string;
    displayName: string;
  }[];
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
    judges: {
      uuid: string;
      email: string;
      displayName: string;
    }[];
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
        dancers: {
          uuid: string;
          email: string;
          displayName: string;
        }[];
        winners: {
          uuid: string;
          email: string;
          displayName: string;
        }[];
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
      dancers: {
        uuid: string;
        email: string;
        displayName: string;
      }[];
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
      teachers: {
        uuid: string;
        email: string;
        displayName: string;
      }[];
    }[];
  }[];
}

export function EventPage() {
  const { id } = useParams();

  function convertGQL(event: GQLEvent) {
    let battleSections = event.battleSections.map((section) => {
      return {
        order: section.order,
        isEditable: false,
        uuid: section.uuid,
        type: section.type as 'battles',
        format: section.format,
        styles: section.styles.map((style) => style.name),
        judges: section.judges.map((person) => {
          return person.email ? `${person.displayName}__${person.uuid}` : person.displayName;
        }),
        brackets: section.brackets
          .map((bracket) => {
            return {
              uuid: bracket.uuid,
              type: bracket.type,
              order: Number(bracket.order),
              battleCards: bracket.battleCards.map((battleCard) => {
                return {
                  order: Number(battleCard.order),
                  uuid: battleCard.uuid,
                  isEditable: false,
                  title: battleCard.title,
                  src: battleCard.src,
                  dancers: battleCard.dancers.map((person) => {
                    return person.email
                      ? `${person.displayName}__${person.uuid}`
                      : person.displayName;
                  }),
                  winners: battleCard.winners.map((person) => {
                    return person.email
                      ? `${person.displayName}__${person.uuid}`
                      : person.displayName;
                  }),
                };
              }),
            };
          })
          .toSorted((a, b) => a.order - b.order),
      };
    });

    let workshopSections = event.workshopSections.map((section) => {
      return {
        order: section.order,
        uuid: section.uuid,
        type: section.type as 'workshops',
        workshopCards: section.workshopCardsIn.map((workshopCard) => {
          return {
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
            teachers: workshopCard.teachers.map((person) => {
              return person.email ? `${person.displayName}__${person.uuid}` : person.displayName;
            }),
          };
        }),
      };
    });

    let performanceSections = event.performanceSections.map((section) => {
      return {
        order: section.order,
        uuid: section.uuid,
        type: section.type as 'performances',
        performanceCards: section.performanceCardsIn.map((performanceCard) => {
          return {
            order: Number(performanceCard.order),
            uuid: performanceCard.uuid,
            isEditable: false,
            title: performanceCard.title,
            src: performanceCard.src,
            dancers: performanceCard.dancers.map((person) => {
              return person.email ? `${person.displayName}__${person.uuid}` : person.displayName;
            }),
          };
        }),
      };
    });

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
      organizers: event.organizers.map((person) => {
        return person.email ? `${person.displayName}__${person.uuid}` : person.displayName;
      }),
      mcs: event.mcs.map((person) => {
        return person.email ? `${person.displayName}__${person.uuid}` : person.displayName;
      }),
      djs: event.djs.map((person) => {
        return person.email ? `${person.displayName}__${person.uuid}` : person.displayName;
      }),
      videographers: event.videographers.map((person) => {
        return person.email ? `${person.displayName}__${person.uuid}` : person.displayName;
      }),
      photographers: event.photographers.map((person) => {
        return person.email ? `${person.displayName}__${person.uuid}` : person.displayName;
      }),
      promoVideo: event.promoVideo,
      recapVideo: event.recapVideo,
      sections: [...battleSections, ...workshopSections, ...performanceSections].sort((a, b) => {
        return a.order - b.order;
      }),
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
