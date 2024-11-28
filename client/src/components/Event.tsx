import { useState } from 'react';
import { Button, Group } from '@mantine/core';
import { ISection } from '../types/types';
import { useEventContext } from './Providers/EventProvider';
import { BattlesSection } from './Sections/BattlesSection';
import { EditBattlesSection } from './Sections/EditBattlesSection';
import { EditEventSection } from './Sections/EditEventSection';
import { EditPartiesSection } from './Sections/EditPartiesSection';
import { EditPerformancesSection } from './Sections/EditPerformancesSection';
import { EditWorkshopsSection } from './Sections/EditWorkshopsSection';
import { EventSection } from './Sections/EventSection';
import { PartiesSection } from './Sections/PartiesSection';
import { PerformancesSection } from './Sections/PerformancesSection';
import { WorkshopsSection } from './Sections/WorkshopsSection';

export function Event() {
  const { eventData, addSection } = useEventContext();
  const [editEvent, setEditEvent] = useState(false);
  const [editSection, setEditSection] = useState<boolean[]>(eventData.sections.map(() => false));

  function deleteSection(sectionIndex: number) {
    //Make Ajax call to delete section
    eventData.sections.splice(sectionIndex, 1);
  }

  function createSection(type: string) {
    let section: ISection;
    //Make Ajax call to add section
    switch (type) {
      case 'battles':
        section = {
          type: 'battles',
          format: 'New Battle',
          styles: [],
          judges: [],
          brackets: [],
        };
        break;
      case 'workshops':
        section = {
          type: 'workshops',
          workshopCards: [],
        };
        break;
      case 'parties':
        section = {
          type: 'parties',
          partyCards: [],
        };
        break;
      case 'performances':
        section = {
          type: 'performances',
          performanceCards: [],
        };
        break;
      default:
        section = {
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

  function setEditSectionArray(value: boolean, sectionIndex: number) {
    const newEditSection = [...editSection];
    newEditSection[sectionIndex] = value;
    setEditSection(newEditSection);
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

      {eventData.sections.map(({ type }: { type: string }, index: number) => {
        switch (type) {
          case 'battles':
            return editSection[index] ? (
              <EditBattlesSection
                key={index}
                sectionIndex={index}
                deleteSection={deleteSection}
                setEditSection={(value) => setEditSectionArray(value, index)}
              />
            ) : (
              <BattlesSection
                key={index}
                sectionIndex={index}
                deleteSection={deleteSection}
                setEditSection={(value) => setEditSectionArray(value, index)}
              />
            );
          case 'workshops':
            return editSection[index] ? (
              <EditWorkshopsSection
                key={index}
                sectionIndex={index}
                deleteSection={deleteSection}
                setEditSection={(value) => setEditSectionArray(value, index)}
              />
            ) : (
              <WorkshopsSection
                key={index}
                sectionIndex={index}
                deleteSection={deleteSection}
                setEditSection={(value) => setEditSectionArray(value, index)}
              />
            );
          case 'parties':
            return editSection[index] ? (
              <EditPartiesSection
                key={index}
                sectionIndex={index}
                deleteSection={deleteSection}
                setEditSection={(value) => setEditSectionArray(value, index)}
              />
            ) : (
              <PartiesSection
                key={index}
                sectionIndex={index}
                deleteSection={deleteSection}
                setEditSection={(value) => setEditSectionArray(value, index)}
              />
            );
          case 'performances':
            return editSection[index] ? (
              <EditPerformancesSection
                key={index}
                sectionIndex={index}
                deleteSection={deleteSection}
                setEditSection={(value) => setEditSectionArray(value, index)}
              />
            ) : (
              <PerformancesSection
                key={index}
                sectionIndex={index}
                deleteSection={deleteSection}
                setEditSection={(value) => setEditSectionArray(value, index)}
              />
            );
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
