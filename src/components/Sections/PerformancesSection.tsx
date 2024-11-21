import { Card, Center, Group, Image, Stack, Text, Title } from '@mantine/core';
import { PartyCard } from '../Cards/PartyCard';
import { PerformanceCard } from '../Cards/PerformanceCard';
import { useEventContext } from '../Providers/EventProvider';

interface PerformanceCard {
  title: string;
  src: string;
  dancers: string[];
}

interface PerformancesSection {
  type: string;
  performanceCards: PerformanceCard[];
}

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function PerformancesSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData } = useEventContext();

  const currentSection = eventData.sections[sectionIndex] as PerformancesSection;

  return (
    <Card m="md" withBorder>
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
