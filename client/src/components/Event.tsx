import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Button, Group } from '@mantine/core';
import { ISection } from '../types/types';
import { useEventContext } from './Providers/EventProvider';
import { BattlesSection } from './Sections/BattlesSection';
import { EditEventSection } from './Sections/EditEventSection';
import { EventSection } from './Sections/EventSection';
import { PartiesSection } from './Sections/PartiesSection';
import { PerformancesSection } from './Sections/PerformancesSection';
import { WorkshopsSection } from './Sections/WorkshopsSection';

export function Event() {
  const { eventData, addSection } = useEventContext();
  const [editEvent, setEditEvent] = useState(false);
  const [editSection, setEditSection] = useState<boolean[]>(eventData.sections.map(() => false));

  function createSection(type: string) {
    let section: ISection;
    //Make Ajax call to add section
    switch (type) {
      case 'battles':
        section = {
          isEditable: true,
          uuid: crypto.randomUUID(),
          type: 'battles',
          format: 'New Battle',
          styles: [],
          judges: [],
          brackets: [],
        };
        break;
      case 'workshops':
        section = {
          uuid: crypto.randomUUID(),
          type: 'workshops',
          workshopCards: [],
        };
        break;
      case 'parties':
        section = {
          uuid: crypto.randomUUID(),
          type: 'parties',
          partyCards: [],
        };
        break;
      case 'performances':
        section = {
          uuid: crypto.randomUUID(),
          type: 'performances',
          performanceCards: [],
        };
        break;

      //Default to battles
      default:
        section = {
          isEditable: true,
          uuid: crypto.randomUUID(),
          type: 'battles',
          format: 'New Battle',
          styles: [],
          judges: [],
          brackets: [],
        };
        break;
    }

    addSection(section);
    setEditSection([...editSection, true]);
  }

  const UPDATE_EVENTS = gql`
    mutation UpdateEvents($where: EventWhere!, $update: EventUpdateInput!) {
      updateEvents(where: $where, update: $update) {
        events {
          uuid
          cost
          description
        }
      }
    }
  `;

  const [updateEvents, { data, loading, error }] = useMutation(UPDATE_EVENTS);

  loading! && console.log(data);

  function sendTest() {
    // updateEvents({
    //   variables: {
    //     where: {
    //       uuid: '123-456-2367',
    //     },
    //     update: {
    //       cost: '500000000',
    //     },
    //     // prizes: submittedValues.prizes,
    //     // description: submittedValues.description,
    //     // images: submittedValues.images.map((image: File) => image.name),
    //     // recapVideo: submittedValues.recapVideo,
    //     // promoVideo: submittedValues.promoVideo,
    //   },
    // });
  }

  return (
    <div>
      {editEvent ? null : (
        <Group m="md" grow>
          <Button onClick={sendTest}>Send Test</Button>
          <Button onClick={() => setEditEvent(!editEvent)}>Edit</Button>
          <Button color="red">Delete</Button>
        </Group>
      )}
      {editEvent ? <EditEventSection setEditEvent={setEditEvent} /> : <EventSection />}

      {eventData.sections.map(({ type }: { type: string }, index: number) => {
        switch (type) {
          case 'battles':
            return <BattlesSection key={index} sectionIndex={index} />;
          case 'workshops':
            return <WorkshopsSection key={index} sectionIndex={index} />;
          case 'parties':
            return <PartiesSection key={index} sectionIndex={index} />;
          case 'performances':
            return <PerformancesSection key={index} sectionIndex={index} />;
          default:
            return null;
        }
      })}
      <Group justify="center" gap="md">
        <Button onClick={() => createSection('battles')}>Add Battles</Button>
        <Button onClick={() => createSection('performances')}>Add Performances</Button>
        <Button onClick={() => createSection('workshops')}>Add Workshops</Button>
        <Button onClick={() => createSection('parties')}>Add Parties</Button>
      </Group>
    </div>
  );
}
