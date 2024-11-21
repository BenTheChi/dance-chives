import { Card, Group, Image, Stack, Title } from '@mantine/core';
import { MultiTextField } from '../Display/MultiTextField';
import { TextField } from '../Display/TextField';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';

interface PerformanceCard {
  title: string;
  src: string;
  dancers: string[];
}

interface PerformancesSection {
  type: string;
  performanceCards: PerformanceCard[];
}

export function PerformanceCard({
  cardIndex,
  sectionIndex,
}: {
  cardIndex: number;
  sectionIndex: number;
}) {
  const { eventData } = useEventContext();
  const card = (eventData.sections[sectionIndex] as PerformancesSection).performanceCards[
    cardIndex
  ];

  return (
    <Card withBorder radius="md" shadow="sm" h="100%">
      <Stack gap="0">
        <Title order={4}>{card.title}</Title>

        <Video title={card.title} src={card.src} />
        {card.dancers?.length > 0 && <MultiTextField title="Dancers" values={card.dancers} />}
      </Stack>
    </Card>
  );
}
