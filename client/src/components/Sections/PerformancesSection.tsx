import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Group, Title } from '@mantine/core';
import { IPerformancesSection } from '@/types/types';
import { PerformanceCard } from '../Cards/PerformanceCard';
import { useEventContext } from '../Providers/EventProvider';

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function PerformancesSection({
  sectionIndex,
  deleteSection,
  setEditSection,
}: {
  sectionIndex: number;
  deleteSection: (sectionIndex: number) => void;
  setEditSection: (value: boolean) => void;
}) {
  const { eventData } = useEventContext();

  const currentSection = eventData.sections[sectionIndex] as IPerformancesSection;

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
        Performances
      </Title>
      <Group mt="sm" p="0" justify="center" gap="lg">
        {currentSection.performanceCards.map((performanceCard, index) => {
          return <PerformanceCard key={index} cardIndex={index} sectionIndex={sectionIndex} />;
        })}
      </Group>
    </Card>
  );
}
