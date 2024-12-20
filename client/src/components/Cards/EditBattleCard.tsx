import { IconSquareXFilled } from '@tabler/icons-react';
import { Card, CloseButton, Group, Text, Textarea, TextInput } from '@mantine/core';
import { IBracket } from '../../types/types';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
import { Video } from '../Video';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];

export function EditBattleCard({
  bracketIndex,
  cardIndex,
  brackets,
  setBrackets,
}: {
  sectionIndex: number;
  bracketIndex: number;
  cardIndex: number;
  brackets: IBracket[];
  setBrackets: (value: IBracket[]) => void;
}) {
  const card = brackets[bracketIndex].battleCards[cardIndex];

  const updateCard = (update: Partial<typeof card>) => {
    const updatedBrackets = [...brackets];
    updatedBrackets[bracketIndex].battleCards[cardIndex] = { ...card, ...update };
    setBrackets(updatedBrackets);
  };

  const setVideoSrc = (src: string) => updateCard({ src });

  const setTitle = (title: string) => updateCard({ title });

  const setDancers = (dancers: string[]) => updateCard({ dancers });

  const setWinners = (winners: string[]) => updateCard({ winners });

  const deleteCard = () => {
    const updatedBrackets = [...brackets];
    updatedBrackets[bracketIndex].battleCards.splice(cardIndex, 1);
    setBrackets(updatedBrackets);
  };

  return (
    <Card withBorder radius="md" shadow="sm" h="100%" w="470">
      <Group>
        <CloseButton
          onClick={deleteCard}
          mb="sm"
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Group>
          <Text fw="bold">Title:</Text>
          <Textarea
            autosize
            minRows={1}
            w="350"
            pb="sm"
            value={card.title}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
        </Group>
      </Group>

      {card.src ? <Video title={card.title} src={card.src} /> : null}
      <Text fw="bold">Recap Video Youtube URL:</Text>
      <TextInput value={card.src} onChange={(event) => setVideoSrc(event.currentTarget.value)} />
      <Text fw="700">Dancers:</Text>
      <MultiSelectCreatable
        notExists={[...notExists, ...card.dancers]}
        value={card.dancers}
        onChange={setDancers}
      />

      <Text fw="700">Winners:</Text>
      <MultiSelectCreatable
        notExists={[...notExists, ...card.winners]}
        value={card.winners}
        onChange={setWinners}
      />
    </Card>
  );
}
