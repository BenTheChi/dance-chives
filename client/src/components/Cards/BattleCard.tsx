import { useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Spoiler, Stack, Text, Title } from '@mantine/core';
import { DELETE_BATTLE_CARD, UPDATE_BATTLE_CARD } from '@/gql/returnQueries';
import { reorderCards } from '@/utilities/utility';
import { IBattlesSection } from '../../types/types';
import { MultiTextField } from '../Display/MultiTextField';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';
import { EditBattleCard } from './EditBattleCard';

export function BattleCard({
  sectionIndex,
  bracketIndex,
  cardIndex,
}: {
  sectionIndex: number;
  bracketIndex: number;
  cardIndex: number;
}) {
  const { eventData, updateCardEditable, deleteCard, updateSection } = useEventContext();

  const battleCard = (eventData.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex]
    .battleCards[cardIndex];

  const [deleteBattleCard, deleteResults] = useMutation(DELETE_BATTLE_CARD);
  const [updateBattleCard, updateResults] = useMutation(UPDATE_BATTLE_CARD);

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

  if (!battleCard.isEditable)
    return (
      <Card withBorder radius="md" shadow="sm" h="100%" w="450">
        <Group justify="space-between">
          <CloseButton
            onClick={() => handleDelete()}
            icon={<IconSquareXFilled size={40} stroke={1.5} />}
          />

          <Button onClick={() => updateCardEditable(sectionIndex, cardIndex, true, bracketIndex)}>
            Edit
          </Button>
        </Group>
        <Title order={4}>{battleCard.title}</Title>
        <Video title={battleCard.title} src={battleCard.src} />
        <Stack>
          {battleCard.dancers?.length > 0 && (
            <MultiTextField title="Dancers" values={battleCard.dancers} />
          )}
          <Spoiler maxHeight={1} w="460" showLabel="See Winners" hideLabel="Hide">
            {battleCard.winners?.length > 0 && (
              <MultiTextField title="Winners" values={battleCard.winners} />
            )}
          </Spoiler>
        </Stack>
      </Card>
    );
  else
    return (
      <EditBattleCard
        sectionIndex={sectionIndex}
        bracketIndex={bracketIndex}
        cardIndex={cardIndex}
      ></EditBattleCard>
    );
}
