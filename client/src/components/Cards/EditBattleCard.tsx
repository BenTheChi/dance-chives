import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Text, Textarea, TextInput } from '@mantine/core';
import { CREATE_BATTLE_CARD, DELETE_BATTLE_CARD, UPDATE_BATTLE_CARD } from '@/gql/returnQueries';
import { createConnectOrCreateListOfRoles, createDeleteListOfRoles } from '@/gql/utilities';
import { buildMutation, ObjectComparison, reorderCards } from '@/utilities/utility';
import { IBattlesSection } from '../../types/types';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];

export function EditBattleCard({
  sectionIndex,
  bracketIndex,
  cardIndex,
}: {
  sectionIndex: number;
  bracketIndex: number;
  cardIndex: number;
}) {
  const { eventData, setEventData, updateCardEditable, deleteCard, updateBattlesSection } =
    useEventContext();

  const card = (eventData.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex]
    .battleCards[cardIndex];

  const [createBattleCard, createResults] = useMutation(CREATE_BATTLE_CARD);
  const [deleteBattleCard, deleteResults] = useMutation(DELETE_BATTLE_CARD);
  const [updateBattleCard, updateResults] = useMutation(UPDATE_BATTLE_CARD);

  const [videoSrc, setVideoSrc] = useState(card.src);
  const [title, setTitle] = useState(card.title);
  const [dancers, setDancers] = useState(card.dancers);
  const [winners, setWinners] = useState(card.winners);

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
    } else {
      const changes = ObjectComparison(
        (eventData.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex].battleCards[
          cardIndex
        ],
        {
          order: card.order,
          title: title,
          src: videoSrc,
          dancers: dancers,
          winners: winners,
        }
      );

      let dancersMutation: { toCreate: string[]; toDelete: string[] } = {
        toCreate: [],
        toDelete: [],
      };
      let winnersMutation: { toCreate: string[]; toDelete: string[] } = {
        toCreate: [],
        toDelete: [],
      };

      if (changes.dancers) {
        dancersMutation = buildMutation(card.dancers || [], changes.dancers || []);
      }

      if (changes.winners) {
        winnersMutation = buildMutation(card.winners || [], changes.winners || []);
      }

      updateBattleCard({
        variables: {
          where: {
            uuid: card.uuid,
          },
          update: {
            order: card.order.toString(),
            title,
            src: videoSrc,
            dancers: {
              connectOrCreate: createConnectOrCreateListOfRoles(dancersMutation.toCreate),
              delete: createDeleteListOfRoles(dancersMutation.toDelete),
            },
            winners: {
              connectOrCreate: createConnectOrCreateListOfRoles(winnersMutation.toCreate),
              delete: createDeleteListOfRoles(winnersMutation.toDelete),
            },
          },
        },
      });
    }
  };

  const handleDelete = () => {
    if (card.uuid === '') {
      deleteCard(sectionIndex, cardIndex, bracketIndex);
    } else {
      deleteBattleCard({
        variables: {
          where: {
            uuid: card.uuid,
          },
        },
      });
    }
  };

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

  useEffect(() => {
    if (!updateResults.loading && updateResults.data) {
      console.log('SUCCESSFUL UPDATE');
      console.log(updateResults.data);

      updateCardEditable(sectionIndex, cardIndex, false, bracketIndex);

      let updatedSection = { ...eventData.sections[sectionIndex] } as IBattlesSection;
      updatedSection.brackets[bracketIndex].battleCards[cardIndex] = {
        order: card.order,
        uuid: card.uuid,
        title,
        src: videoSrc,
        dancers,
        winners,
        isEditable: false,
      };

      updateBattlesSection(sectionIndex, updatedSection);
    }
  }, [updateResults.loading, updateResults.data]);

  useEffect(() => {
    if (!deleteResults.loading && deleteResults.data) {
      console.log('SUCCESSFUL DELETE');
      console.log(deleteResults.data);

      deleteCard(sectionIndex, cardIndex, bracketIndex);

      let reorderedCards = reorderCards(
        (eventData.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex].battleCards
      );

      for (let i = 0; i < reorderedCards.updatedCards.length; i++) {
        let updatedCard = reorderedCards.updatedCards[i];

        updateBattleCard({
          variables: {
            where: {
              uuid: updatedCard.uuid,
            },
            update: {
              order: updatedCard.order.toString(),
            },
          },
        });
      }

      let updatedSection = { ...eventData.sections[sectionIndex] } as IBattlesSection;
      updatedSection.brackets[bracketIndex].battleCards = reorderedCards.sorted;

      updateBattlesSection(sectionIndex, updatedSection);
    }
  }, [deleteResults.loading, deleteResults.data]);

  return (
    <Card withBorder radius="md" shadow="sm" h="100%" w="450">
      <Group>
        <CloseButton
          onClick={() => handleDelete()}
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
