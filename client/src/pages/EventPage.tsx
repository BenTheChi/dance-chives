import { gql, useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { EventProvider } from '@/components/Providers/EventProvider';
import { getEvent } from '@/gql/returnQueries';
import { IEvent } from '@/types/types';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Event } from '../components/Event';

interface GQLEvent {
  __typename: string;
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
    __typename: string;
    uuid: string;
    email: string;
    displayName: string;
  }[];
  mcs: {
    __typename: string;
    uuid: string;
    email: string;
    displayName: string;
  }[];
  djs: {
    __typename: string;
    uuid: string;
    email: string;
    displayName: string;
  }[];
  videographers: {
    __typename: string;
    uuid: string;
    email: string;
    displayName: string;
  }[];
  graphicDesigners: {
    __typename: string;
    uuid: string;
    email: string;
    displayName: string;
  }[];
  photographers: {
    __typename: string;
    uuid: string;
    email: string;
    displayName: string;
  }[];
  inCity: {
    __typename: string;
    name: string;
    state: string;
    country: string;
  };
  styles: {
    __typename: string;
    name: string;
  }[];
  battleSections: {
    __typename: string;
    uuid: string;
    type: 'battles';
    format: string;
    judges: {
      __typename: string;
      uuid: string;
      email: string;
      displayName: string;
    }[];
    styles: {
      __typename: string;
      name: string;
    }[];
    brackets: {
      __typename: string;
      uuid: string;
      type: string;
      order: number;
      battleCards: {
        __typename: string;
        title: string;
        src: string;
        dancers: {
          __typename: string;
          uuid: string;
          email: string;
          displayName: string;
        }[];
        winners: {
          __typename: string;
          uuid: string;
          email: string;
          displayName: string;
        }[];
      }[];
    }[];
  }[];
  performanceSections: {
    __typename: string;
    uuid: string;
    type: 'performances';
    performanceCardsIn: {
      __typename: string;
      uuid: string;
      title: string;
      src: string;
      dancers: {
        __typename: string;
        uuid: string;
        email: string;
        displayName: string;
      }[];
    }[];
  }[];
  workshopSections: {
    __typename: string;
    uuid: string;
    type: 'workshops';
    workshopCardsIn: {
      __typename: string;
      uuid: string;
      title: string;
      cost: string;
      date: number;
      address: string;
      image: string;
      recapSrc: string;
      styles: {
        __typename: string;
        name: string;
      }[];
      teachers: {
        __typename: string;
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
              order: bracket.order,
              battleCards: bracket.battleCards.map((battleCard) => {
                return {
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
          .sort((a, b) => a.order - b.order),
      };
    });

    let workshopSections = event.workshopSections.map((section) => {
      return {
        uuid: section.uuid,
        type: section.type as 'workshops',
        workshopCards: section.workshopCardsIn.map((workshopCard) => {
          return {
            isEditable: false,
            title: workshopCard.title,
            image: workshopCard.image,
            date: workshopCard.date,
            address: workshopCard.address,
            cost: workshopCard.cost,
            recapSrc: workshopCard.recapSrc,
            styles: workshopCard.styles.map((style) => style.name),
            teacher: workshopCard.teachers.map((person) => {
              return person.email ? `${person.displayName}__${person.uuid}` : person.displayName;
            }),
          };
        }),
      };
    });

    let performanceSections = event.performanceSections.map((section) => {
      return {
        uuid: section.uuid,
        type: section.type as 'performances',
        performanceCards: section.performanceCardsIn.map((performanceCard) => {
          return {
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
      sections: [...battleSections, ...workshopSections, ...performanceSections],
    };
  }

  let eventData: IEvent | undefined;
  const { loading, data } = useQuery(getEvent(id || ''));

  if (!loading) {
    eventData = convertGQL(data.events[0]);
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
