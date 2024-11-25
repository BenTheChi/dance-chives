import { useState } from 'react';
import { Button, Group } from '@mantine/core';
import { useEventContext } from './Providers/EventProvider';
import { BattlesSection } from './Sections/BattlesSection';
import { EditEventSection } from './Sections/EditEventSection';
import { EventSection } from './Sections/EventSection';
import { PartiesSection } from './Sections/PartiesSection';
import { PerformancesSection } from './Sections/PerformancesSection';
import { WorkshopsSection } from './Sections/WorkshopsSection';

export function Event() {
  const { eventData } = useEventContext();
  const [editEvent, setEditEvent] = useState(false);

  return (
    <div>
      {editEvent ? null : (
        <Group m="md" grow>
          <Button onClick={() => setEditEvent(!editEvent)}>Edit</Button>
          <Button color="red">Delete</Button>
        </Group>
      )}
      {editEvent ? <EditEventSection setEditEvent={setEditEvent} /> : <EventSection />}

      {eventData.sections.map(({ type }, index) => {
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
    </div>
  );
}
