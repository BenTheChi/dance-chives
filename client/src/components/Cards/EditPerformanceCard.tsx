import { IconSquareXFilled } from '@tabler/icons-react';
import { Card, CloseButton, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { IPerformanceCard } from '@/types/types';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
import { Video } from '../Video';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];

export function EditPerformanceCard({
  cardIndex,
  deleteCard,
  performanceCards,
  setPerformanceCards,
}: {
  cardIndex: number;
  deleteCard: (index: number) => void;
  performanceCards: IPerformanceCard[];
  setPerformanceCards: (value: IPerformanceCard[]) => void;
}) {
  const performanceCard = performanceCards[cardIndex];

  const updateCard = (update: Partial<typeof performanceCard>) => {
    const updatePerformanceCards = [...performanceCards];
    updatePerformanceCards[cardIndex] = { ...performanceCard, ...update };
    setPerformanceCards(updatePerformanceCards);
  };

  const setTitle = (title: string) => updateCard({ title });
  const setVideoSrc = (src: string) => updateCard({ src });
  const setDancers = (dancers: string[]) => updateCard({ dancers });

  return (
    <Card withBorder radius="md" shadow="sm" h="100%">
      <CloseButton
        onClick={() => deleteCard(cardIndex)}
        mb="sm"
        icon={<IconSquareXFilled size={40} stroke={1.5} />}
      />

      <Stack gap="0">
        <Text fw="bold">Title:</Text>
        <Textarea
          autosize
          minRows={1}
          w="350"
          pb="sm"
          value={performanceCard.title}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />

        <Stack>
          {performanceCard.src ? (
            <Video title={performanceCard.title} src={performanceCard.src} />
          ) : null}
          <Text fw="bold">Performance Youtube URL:</Text>
          <TextInput
            value={performanceCard.src}
            onChange={(event) => setVideoSrc(event.currentTarget.value)}
          />
        </Stack>

        <Text fw="700">Dancers:</Text>
        <MultiSelectCreatable
          notExists={[...notExists, ...performanceCard.dancers]}
          value={performanceCard.dancers}
          onChange={setDancers}
        />
      </Stack>
    </Card>
  );
}
