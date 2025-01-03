import { useState } from 'react';
import { Button, Flex, Group } from '@mantine/core';
import { useEventContext } from './Providers/EventProvider';
import { BattlesSection } from './Sections/BattlesSection';
import { EditEventSection } from './Sections/EditEventSection';
import { EventSection } from './Sections/EventSection';
import { PartiesSection } from './Sections/PartiesSection';
import { PerformancesSection } from './Sections/PerformancesSection';
import { WorkshopsSection } from './Sections/WorkshopsSection';

export function Event() {
  const { eventData, addSection, addCard } = useEventContext();
  const [editEvent, setEditEvent] = useState(false);

  function createSection(type: string) {
    addSection(type);

    if (type !== 'battles') {
      addCard(eventData.sections.length - 1);
    }
  }

  return (
    <div>
      {editEvent ? null : (
        <Group m="md" grow>
          <Button onClick={() => setEditEvent(!editEvent)}>Edit</Button>
          <Button color="red">Delete</Button>
        </Group>
      )}
      {editEvent ? <EditEventSection setEditEvent={setEditEvent} /> : <EventSection />}
      <Group justify="center" gap="md">
        <Button onClick={() => createSection('battles')}>Add Battles</Button>
        <Button onClick={() => createSection('performances')}>Add Performances</Button>
        <Button onClick={() => createSection('workshops')}>Add Workshops</Button>
        <Button onClick={() => createSection('parties')}>Add Parties</Button>
      </Group>
      <Flex justify="center" align="center" direction="column-reverse" gap="md">
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
      </Flex>
    </div>
  );
}
