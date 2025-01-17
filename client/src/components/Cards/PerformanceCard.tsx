import { useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Stack, Title } from '@mantine/core';
import { DELETE_PERFORMANCE_CARD, UPDATE_PERFORMANCE_CARD } from '@/gql/returnQueries';
import { createListOfRoles } from '@/gql/utilities';
import { IPerformancesSection, UserBasicInfo } from '@/types/types';
import { reorderCards } from '@/utilities/utility';
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
  const [deletePerformanceCard, deleteResults] = useMutation(DELETE_PERFORMANCE_CARD);
  const [updatePerformanceCard, updateResults] = useMutation(UPDATE_PERFORMANCE_CARD);

  const { eventData, deleteCard, updateCardEditable, updateSection } = useEventContext();
  const performanceCard = (eventData.sections[sectionIndex] as IPerformancesSection)
    .performanceCards[cardIndex];

  const updateEvent = (updatedValues: UserBasicInfo[], role: string) => {
    const changes = {
      [role]: {
        disconnect: [{ where: {} }],
        connect: createListOfRoles(updatedValues),
      },
    };

    updatePerformanceCard({
      variables: {
        where: {
          uuid: performanceCard.uuid,
        },
        update: changes,
      },
    });
  };

  const handleDelete = () => {
    deletePerformanceCard({
      variables: {
        where: { uuid: performanceCard.uuid },
      },
    });
  };

  useEffect(() => {
    if (!deleteResults.loading && deleteResults.data) {
      console.log('SUCCESSFUL DELETE');
      console.log(deleteResults.data);

      deleteCard(sectionIndex, cardIndex);

      let reorderedCards = reorderCards(
        (eventData.sections[sectionIndex] as IPerformancesSection).performanceCards
      );

      console.log(reorderedCards);

      for (let i = 0; i < reorderedCards.updatedCards.length; i++) {
        let updatedCard = reorderedCards.updatedCards[i];

        updatePerformanceCard({
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

      let updatedSection = { ...eventData.sections[sectionIndex] } as IPerformancesSection;
      updatedSection.performanceCards = reorderedCards.sorted;

      updateSection(sectionIndex, updatedSection);
      console.log(eventData);
    }
  }, [deleteResults.loading, deleteResults.data]);

  useEffect(() => {
    if (!updateResults.loading && updateResults.data) {
      console.log('SUCCESSFUL UPDATE');
      console.log(updateResults.data);

      let updatedSection = { ...eventData.sections[sectionIndex] } as IPerformancesSection;
      const updatedCard = updateResults.data.updatePerformanceCards.performanceCards[0];
      updatedSection.performanceCards[cardIndex] = {
        ...performanceCard,
        dancers: updatedCard.dancers,
      };
      updateSection(sectionIndex, updatedSection);
    }
  }, [updateResults.loading, updateResults.data]);

  if (performanceCard.isEditable) {
    return <EditPerformanceCard sectionIndex={sectionIndex} cardIndex={cardIndex} />;
  }

  return (
    <Card withBorder radius="md" shadow="sm" h="100%">
      <Group justify="space-between">
        <CloseButton
          onClick={() => handleDelete()}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Group justify="right">
          <Button onClick={() => updateCardEditable(sectionIndex, cardIndex, true)}>Edit</Button>
        </Group>
      </Group>
      <Stack gap="0">
        <Title order={4}>{performanceCard.title}</Title>
        <Video title={performanceCard.title} src={performanceCard.src} />
        <MultiTextField
          title="Dancers"
          values={performanceCard.dancers}
          updateEvent={updateEvent}
        />
      </Stack>
    </Card>
  );
}
