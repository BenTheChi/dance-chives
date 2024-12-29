import { IconCirclePlus, IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Group, Title } from '@mantine/core';
import { IWorkshopsSection } from '@/types/types';
import { WorkshopCard } from '../Cards/WorkshopCard';
import { useEventContext } from '../Providers/EventProvider';

export function WorkshopsSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData, deleteSection, addCard } = useEventContext();
  const currentSection = eventData.sections[sectionIndex] as IWorkshopsSection;

  return (
    <Card m="md" withBorder>
      <Group justify="space-between">
        <CloseButton
          onClick={() => deleteSection(sectionIndex)}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
      </Group>
      <Title component={Center} order={3}>
        Workshops
      </Title>
      <Group mt="sm" p="0" justify="center" gap="lg">
        <Button onClick={() => addCard(sectionIndex)} variant="outline" h="375" w="460">
          <Group align="center" justify="space-between">
            <IconCirclePlus size={100} />
            <Title order={4}>Add Workshop</Title>
          </Group>
        </Button>

        {currentSection.workshopCards.map((workshopCard, index) => {
          return <WorkshopCard key={index} cardIndex={index} sectionIndex={sectionIndex} />;
        })}
      </Group>
    </Card>
  );
}
