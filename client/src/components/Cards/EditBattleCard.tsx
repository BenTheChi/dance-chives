import { useState } from 'react';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Text, Textarea, TextInput } from '@mantine/core';
import { IBattlesSection, IBracket } from '../../types/types';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];

export function EditBattleCard({
  sectionIndex,
  bracketIndex,
  cardIndex,
  // brackets,
  // setBrackets,
  // setEditCard,
}: {
  sectionIndex: number;
  bracketIndex: number;
  cardIndex: number;
  // brackets: IBracket[];
  // setBrackets: (value: IBracket[]) => void;
  // setEditCard: (value: boolean) => void;
}) {
  const { eventData, setEventData } = useEventContext();

  const card = (eventData.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex]
    .battleCards[cardIndex];
  // const card = brackets[bracketIndex].battleCards[cardIndex];

  // const updateCard = (update: Partial<typeof card>) => {
  //   // const updatedBrackets = [...brackets];
  //   // updatedBrackets[bracketIndex].battleCards[cardIndex] = { ...card, ...update };
  //   // setBrackets(updatedBrackets);
  // };

  const [videoSrc, setVideoSrc] = useState(card.src);
  const [title, setTitle] = useState(card.title);
  const [dancers, setDancers] = useState(card.dancers);
  const [winners, setWinners] = useState(card.winners);

  // const updateCard = (update: Partial<typeof card>) => {
  //   // const updatedCard = { ...card, ...update };
  //   // setVideoSrc(updatedCard.src);
  //   // setTitle(updatedtitle);
  //   // setDancers(updatedCard.dancers);
  //   // setWinners(updatedCard.winners);
  //   // const updatedBrackets = [...brackets];
  //   // updatedBrackets[bracketIndex].battleCards[cardIndex] = updatedCard;
  //   // setBrackets(updatedBrackets);
  // };

  const resetFields = () => {
    setTitle(card.title);
    setVideoSrc(card.src);
    setDancers(card.dancers);
    setWinners(card.winners);
  };

  const handleSubmit = () => {
    let newEventData = { ...eventData };
    (newEventData.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex].battleCards[
      cardIndex
    ] = {
      title,
      src: videoSrc,
      dancers,
      winners,
      isEditable: false,
    };
    setEventData(newEventData);
  };

  const deleteCard = () => {
    let newEventData = { ...eventData };
    (newEventData.sections[sectionIndex] as IBattlesSection).brackets[
      bracketIndex
    ].battleCards.splice(cardIndex, 1);
    setEventData(newEventData);
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
          <Button onClick={() => handleSubmit()} color="green">
            Save
          </Button>
          <Button onClick={() => resetFields()}>Reset</Button>
          <Button
            color="red"
            onClick={() => {
              const updatedEvent = { ...eventData };
              (updatedEvent.sections[sectionIndex] as IBattlesSection).brackets[
                bracketIndex
              ].battleCards[cardIndex].isEditable = false;
              setEventData(updatedEvent);
            }}
          >
            Cancel
          </Button>
        </Group>
        <Group>
          <Text fw="bold">Title:</Text>
          <Textarea
            autosize
            minRows={1}
            w="350"
            pb="sm"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
        </Group>
      </Group>

      {videoSrc ? <Video title={title} src={videoSrc} /> : null}
      <Text fw="bold">Video Youtube URL:</Text>
      <TextInput value={videoSrc} onChange={(event) => setVideoSrc(event.currentTarget.value)} />
      <Text fw="700">Dancers:</Text>
      <MultiSelectCreatable
        notExists={[...notExists, ...dancers]}
        value={dancers}
        onChange={setDancers}
      />

      <Text fw="700">Winners:</Text>
      <MultiSelectCreatable
        notExists={[...notExists, ...winners]}
        value={winners}
        onChange={setWinners}
      />
    </Card>
  );
}
