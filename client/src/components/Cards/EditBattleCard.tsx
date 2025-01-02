import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Text, Textarea, TextInput } from '@mantine/core';
import { CREATE_BATTLE_CARD } from '@/gql/returnQueries';
import { createConnectOrCreateListOfRoles } from '@/gql/utilities';
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
  const { eventData, setEventData, updateCardEditable, deleteCard } = useEventContext();

  const card = (eventData.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex]
    .battleCards[cardIndex];

  const [createBattleCard, createResults] = useMutation(CREATE_BATTLE_CARD);
  // const [updateBattleCard, updateResults] = useMutation(UPDATE_BATTLE_CARD);

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
    //New Card
    if (card.uuid === '') {
      createBattleCard({
        variables: {
          input: [
            {
              order: card.order.toString(),
              uuid: crypto.randomUUID(),
              src: videoSrc,
              title,
              dancers: {
                connectOrCreate: createConnectOrCreateListOfRoles(dancers),
              },
              winners: {
                connectOrCreate: createConnectOrCreateListOfRoles(winners),
              },
              inBrackets: {
                connect: {
                  where: {
                    node: {
                      uuid: (eventData.sections[sectionIndex] as IBattlesSection).brackets[
                        bracketIndex
                      ].uuid,
                    },
                  },
                },
              },
            },
          ],
        },
      });
    }
  };

  // const deleteCard = () => {
  //   let newEventData = { ...eventData };
  //   (newEventData.sections[sectionIndex] as IBattlesSection).brackets[
  //     bracketIndex
  //   ].battleCards.splice(cardIndex, 1);
  //   setEventData(newEventData);
  // };

  console.log(cardIndex);

  useEffect(() => {
    if (!createResults.loading && createResults.data) {
      console.log('SUCCESSFUL CREATE');
      console.log(createResults.data);

      let newEventData = { ...eventData };
      (newEventData.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex].battleCards[
        cardIndex
      ] = {
        order: card.order,
        uuid: createResults.data.createBattleCards.battleCards[0].uuid,
        title,
        src: videoSrc,
        dancers,
        winners,
        isEditable: false,
      };

      setEventData(newEventData);
    }
  }, [createResults.loading, createResults.data]);

  return (
    <Card withBorder radius="md" shadow="sm" h="100%" w="470" m="md">
      <Group>
        <CloseButton
          onClick={() => deleteCard(sectionIndex, cardIndex, bracketIndex)}
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
              console.log(eventData);
              console.log(sectionIndex, cardIndex, bracketIndex);
              if (title === '' && videoSrc === '') {
                deleteCard(sectionIndex, cardIndex, bracketIndex);
                return;
              }
              updateCardEditable(sectionIndex, cardIndex, false, bracketIndex);
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
