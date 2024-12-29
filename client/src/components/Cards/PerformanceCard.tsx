import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Stack, Title } from '@mantine/core';
import { IPerformancesSection } from '@/types/types';
import { MultiTextField } from '../Display/MultiTextField';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';
import { EditPerformanceCard } from './EditPerformanceCard';

export function PerformanceCard({
  cardIndex,
  sectionIndex,
}: {
  cardIndex: number;
  sectionIndex: number;
}) {
  const { eventData, updateCardEditable, deleteCard } = useEventContext();
  const card = (eventData.sections[sectionIndex] as IPerformancesSection).performanceCards[
    cardIndex
  ];

  if (card.isEditable) {
    return <EditPerformanceCard cardIndex={cardIndex} sectionIndex={sectionIndex} />;
  }
  return (
    <Card withBorder radius="md" shadow="sm" h="100%">
      <Group justify="space-between">
        <CloseButton
          onClick={() => deleteCard(sectionIndex, cardIndex)}
          mb="sm"
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Button onClick={() => updateCardEditable(sectionIndex, cardIndex, true)}>Edit</Button>
      </Group>
      <Stack gap="0">
        <Title order={4}>{card.title}</Title>

        <Video title={card.title} src={card.src} />
        {card.dancers?.length > 0 && <MultiTextField title="Dancers" values={card.dancers} />}
      </Stack>
    </Card>
  );
}
