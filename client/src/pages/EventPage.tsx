import { gql, useQuery } from '@apollo/client';
import { EventProvider } from '@/components/Providers/EventProvider';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Event } from '../components/Event';
import eventData from '../single-event-test.json';

export function EventPage() {
  const getEventQuery = gql`
    query GetEvent {
      events(where: { title: "Frankenfunk vol 3" }) {
        title
        date
        description
        address
        addressName
        cost
        images
        inCityCities {
          name
          state
          country
        }
        stylesFeaturedIn {
          name
        }
        battleSections: sectionsPartOf(where: { type: "battles" }) {
          uuid
          type
          bracketsIn {
            uuid
            type
            order
            battleCardsIn {
              title
              src
              peopleDancesIn {
                uuid
                name
                displayName
              }
              peopleWinnerOf {
                uuid
                name
                displayName
              }
            }
          }
        }
        performanceSections: sectionsPartOf(where: { type: "performances" }) {
          uuid
          type
          performanceCardsIn {
            uuid
            title
            src
            peopleDancesIn {
              uuid
              name
              displayName
            }
          }
        }
        workshopSections: sectionsPartOf(where: { type: "workshops" }) {
          uuid
          type
          workshopCardsIn {
            uuid
            title
            cost
            date
            address
            peopleTeachesIn {
              uuid
              name
              displayName
            }
          }
        }
      }
    }
  `;

  const { loading, data } = useQuery(getEventQuery);

  if (!loading) console.log(data.events[0]);

  return (
    <BasicAppShell>
      <DarkModeToggle />
      <EventProvider initialEventData={eventData}>
        <Event />
      </EventProvider>
    </BasicAppShell>
  );
}
