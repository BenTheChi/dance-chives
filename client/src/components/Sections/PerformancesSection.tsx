import { IconCirclePlus, IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Group, Title } from '@mantine/core';
import { IPerformancesSection } from '@/types/types';
import { PerformanceCard } from '../Cards/PerformanceCard';
import { useEventContext } from '../Providers/EventProvider';

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function PerformancesSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData, addCard, deleteSection } = useEventContext();

  const currentSection = eventData.sections[sectionIndex] as IPerformancesSection;

  return (
    <Card m="md" withBorder>
      <Group justify="space-between">
        <CloseButton
          onClick={() => deleteSection(sectionIndex)}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
      </Group>
      <Title component={Center} order={3}>
        Performances
      </Title>
      <Group mt="sm" p="0" justify="center" gap="lg">
        <Button onClick={() => addCard(sectionIndex)} variant="outline" h="375" w="460">
          <Group align="center" justify="space-between">
            <IconCirclePlus size={100} />
            <Title order={4}>Add Performance</Title>
          </Group>
        </Button>

        {currentSection.performanceCards.map((performanceCard, index) => {
          return <PerformanceCard key={index} cardIndex={index} sectionIndex={sectionIndex} />;
        })}
      </Group>
    </Card>
  );
}
