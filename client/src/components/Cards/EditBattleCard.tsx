import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Text, Textarea, TextInput } from '@mantine/core';
import { CREATE_BATTLE_CARD, DELETE_BATTLE_CARD, UPDATE_BATTLE_CARD } from '@/gql/returnQueries';
import { createDeleteListOfRoles, createListOfRoles } from '@/gql/utilities';
import { buildMutation, ObjectComparison, reorderCards } from '@/utilities/utility';
import { IBattlesSection, UserBasicInfo } from '../../types/types';
import { UsersMultiSelect } from '../Inputs/UsersMultiSelect';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';

export function EditBattleCard({
  sectionIndex,
  bracketIndex,
  cardIndex,
}: {
  sectionIndex: number;
  bracketIndex: number;
  cardIndex: number;
}) {
  const { eventData, setEventData, updateCardEditable, deleteCard, updateSection } =
    useEventContext();

  const battleCard = (eventData.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex]
    .battleCards[cardIndex];

  const [createBattleCard, createResults] = useMutation(CREATE_BATTLE_CARD);
  const [deleteBattleCard, deleteResults] = useMutation(DELETE_BATTLE_CARD);
  const [updateBattleCard, updateResults] = useMutation(UPDATE_BATTLE_CARD);

  const [videoSrc, setVideoSrc] = useState(battleCard.src);
  const [title, setTitle] = useState(battleCard.title);
  const [dancers, setDancers] = useState(battleCard.dancers);
  const [winners, setWinners] = useState(battleCard.winners);

  const resetFields = () => {
    setTitle(battleCard.title);
    setVideoSrc(battleCard.src);
    setDancers(battleCard.dancers);
    setWinners(battleCard.winners);
  };

  const handleSubmit = () => {
    //New Card
    if (battleCard.uuid === '') {
      createBattleCard({
        variables: {
          input: [
            {
              order: battleCard.order.toString(),
              uuid: crypto.randomUUID(),
              src: videoSrc,
              title,
              dancers: {
                connect: createListOfRoles(dancers),
              },
              winners: {
                connect: createListOfRoles(winners),
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
          order: battleCard.order,
          title: title,
          src: videoSrc,
          dancers: dancers,
          winners: winners,
        }
      );

      // let dancersMutation: { toCreate: string[]; toDelete: string[] } = {
      //   toCreate: [],
      //   toDelete: [],
      // };
      // let winnersMutation: { toCreate: string[]; toDelete: string[] } = {
      //   toCreate: [],
      //   toDelete: [],
      // };

      // if (changes.dancers) {
      //   dancersMutation = buildMutation(battleCard.dancers || [], changes.dancers || []);
      // }

      // if (changes.winners) {
      //   winnersMutation = buildMutation(battleCard.winners || [], changes.winners || []);
      // }

      updateBattleCard({
        variables: {
          where: {
            uuid: battleCard.uuid,
          },
          update: {
            order: battleCard.order.toString(),
            title,
            src: videoSrc,
            dancers: {
              disconnect: [{ where: {} }],
              connect: createListOfRoles(dancers),
            },
            winners: {
              disconnect: [{ where: {} }],
              connect: createListOfRoles(winners),
            },
          },
        },
      });
    }
  };

  const handleDelete = () => {
    if (battleCard.uuid === '') {
      deleteCard(sectionIndex, cardIndex, bracketIndex);
    } else {
      deleteBattleCard({
        variables: {
          where: {
            uuid: battleCard.uuid,
          },
        },
      });
    }
  };

  const handleCancel = () => {
    if (battleCard.uuid === '') {
      deleteCard(sectionIndex, cardIndex, bracketIndex);
      return;
    }
    updateCardEditable(sectionIndex, cardIndex, false, bracketIndex);
  };

  useEffect(() => {
    if (!createResults.loading && createResults.data) {
      console.log('SUCCESSFUL CREATE');
      console.log(createResults.data);

      let newEventData = { ...eventData };
      (newEventData.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex].battleCards[
        cardIndex
      ] = {
        order: battleCard.order,
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
        order: battleCard.order,
        uuid: battleCard.uuid,
        title,
        src: videoSrc,
        dancers,
        winners,
        isEditable: false,
      };

      updateSection(sectionIndex, updatedSection);
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

      updateSection(sectionIndex, updatedSection);
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
          <Button color="red" onClick={() => handleCancel()}>
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
      <UsersMultiSelect value={dancers} onChange={(value) => setDancers(value)} />

      <Text fw="700">Winners:</Text>
      <UsersMultiSelect value={winners} onChange={(value) => setWinners(value)} />
    </Card>
  );
}
