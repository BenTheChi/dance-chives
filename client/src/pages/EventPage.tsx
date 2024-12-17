import { gql, useQuery } from '@apollo/client';
import { EventProvider } from '@/components/Providers/EventProvider';
import { IEvent } from '@/types/types';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Event } from '../components/Event';

// import eventData from '../single-event-test.json';

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
  stylesFeaturedIn: {
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
    stylesFeaturedIn: {
      __typename: string;
      name: string;
    }[];
    bracketsIn: {
      __typename: string;
      uuid: string;
      type: string;
      order: string;
      battleCardsIn: {
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
      stylesFeaturedIn: {
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
  function convertGQL(event: GQLEvent) {
    console.log(event);

    let battleSections = event.battleSections.map((section) => {
      return {
        type: section.type as 'battles',
        format: section.format,
        styles: section.stylesFeaturedIn.map((style) => style.name),
        judges: section.judges.map((person) => {
          return person.email ? `${person.displayName}__${person.uuid}` : person.displayName;
        }),
        brackets: section.bracketsIn.map((bracket) => {
          return {
            type: bracket.type,
            order: bracket.order,
            battleCards: bracket.battleCardsIn.map((battleCard) => {
              return {
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
        }),
      };
    });

    let workshopSections = event.workshopSections.map((section) => {
      return {
        type: section.type as 'workshops',
        workshopCards: section.workshopCardsIn.map((workshopCard) => {
          return {
            title: workshopCard.title,
            image: workshopCard.image,
            date: workshopCard.date,
            address: workshopCard.address,
            cost: workshopCard.cost,
            recapSrc: workshopCard.recapSrc,
            styles: workshopCard.stylesFeaturedIn.map((style) => style.name),
            teacher: workshopCard.teachers.map((person) => {
              return person.email ? `${person.displayName}__${person.uuid}` : person.displayName;
            }),
          };
        }),
      };
    });

    let performanceSections = event.performanceSections.map((section) => {
      return {
        type: section.type as 'performances',
        performanceCards: section.performanceCardsIn.map((performanceCard) => {
          return {
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
      id: event.uuid,
      title: event.title,
      date: event.date,
      city: event.inCity.name,
      styles: event.stylesFeaturedIn.map((style) => style.name),
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
      // sponsors: ['Dancers Group Ca$h Dance Grant Program'],
      promoVideo: event.promoVideo,
      recapVideo: event.recapVideo,
      sections: [...battleSections, ...workshopSections, ...performanceSections],
    };
  }

  const getEventQuery = gql`
    query GetEvent {
      events(where: { title: "Frankenfunk vol 3" }) {
        uuid
        title
        date
        description
        address
        addressName
        cost
        images
        prizes
        promoVideo
        recapVideo
        organizers {
          uuid
          displayName
          email
        }
        mcs {
          uuid
          displayName
          email
        }
        djs {
          uuid
          displayName
          email
        }
        videographers {
          uuid
          displayName
          email
        }
        graphicDesigners {
          uuid
          displayName
          email
        }
        photographers {
          uuid
          displayName
          email
        }
        inCity {
          name
        }
        stylesFeaturedIn {
          name
        }
        battleSections: sectionsPartOf(where: { type: "battles" }) {
          type
          format
          stylesFeaturedIn {
            name
          }
          judges {
            uuid
            email
            displayName
          }
          bracketsIn {
            type
            order
            battleCardsIn {
              title
              src
              dancers {
                uuid
                email
                displayName
              }
              winners {
                uuid
                email
                displayName
              }
            }
          }
        }
        performanceSections: sectionsPartOf(where: { type: "performances" }) {
          type
          performanceCardsIn {
            title
            src
            dancers {
              uuid
              email
              displayName
            }
          }
        }
        workshopSections: sectionsPartOf(where: { type: "workshops" }) {
          type
          workshopCardsIn {
            title
            cost
            date
            address
            image
            recapSrc
            stylesFeaturedIn {
              name
            }
            teachers {
              uuid
              email
              displayName
            }
          }
        }
      }
    }
  `;

  let eventData: IEvent | undefined;
  const { loading, data } = useQuery(getEventQuery);

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
