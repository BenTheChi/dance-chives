import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Group, Title } from '@mantine/core';
import { IWorkshopsSection } from '@/types/types';
import { WorkshopCard } from '../Cards/WorkshopCard';
import { useEventContext } from '../Providers/EventProvider';

export function WorkshopsSection({
  sectionIndex,
  deleteSection,
  setEditSection,
}: {
  sectionIndex: number;
  deleteSection: (sectionIndex: number) => void;
  setEditSection: (value: boolean) => void;
}) {
  const { eventData } = useEventContext();

  const currentSection = eventData.sections[sectionIndex] as IWorkshopsSection;

  const handleDeleteSection = () => {
    setEditSection(false);
    deleteSection(sectionIndex);
  };

  return (
    <Card m="md" withBorder>
      <Group justify="space-between">
        <CloseButton
          onClick={handleDeleteSection}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Group justify="right">
          <Button onClick={() => setEditSection(true)}>Edit</Button>
        </Group>
      </Group>
      <Title component={Center} order={3}>
        Workshops
      </Title>
      <Group mt="sm" p="0" justify="center" gap="lg">
        {currentSection.workshopCards.map((workshopCard, index) => {
          return <WorkshopCard key={index} cardIndex={index} sectionIndex={sectionIndex} />;
        })}
      </Group>
    </Card>
  );
}
