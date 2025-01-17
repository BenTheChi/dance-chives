import { useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Image, Stack, Title } from '@mantine/core';
import { DELETE_WORKSHOP_CARD, UPDATE_WORKSHOP_CARD } from '@/gql/returnQueries';
import { createConnectOrCreateListOfStyles, createListOfRoles } from '@/gql/utilities';
import { IWorkshopsSection, UserBasicInfo } from '@/types/types';
import { reorderCards } from '@/utilities/utility';
import { MultiTextField } from '../Display/MultiTextField';
import { MultiTextStyleField } from '../Display/MultiTextStyleField';
import { TextField } from '../Display/TextField';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';
import { EditWorkshopCard } from './EditWorkshopCard';

export function WorkshopCard({
  cardIndex,
  sectionIndex,
}: {
  cardIndex: number;
  sectionIndex: number;
}) {
  const [deleteWorkshopCard, deleteResults] = useMutation(DELETE_WORKSHOP_CARD);
  const [updateWorkshopCard, updateResults] = useMutation(UPDATE_WORKSHOP_CARD);

  const { eventData, deleteCard, updateCardEditable, updateSection, deleteSection } =
    useEventContext();
  const workshopCard = (eventData.sections[sectionIndex] as IWorkshopsSection).workshopCards[
    cardIndex
  ];

  const updateEvent = (updatedValues: UserBasicInfo[] | string[], role: string) => {
    let changes;
    if (role === 'styles') {
      changes = {
        styles: {
          connectOrCreate: createConnectOrCreateListOfStyles(updatedValues as string[]),
        },
      };
    } else {
      changes = {
        [role]: {
          disconnect: [{ where: {} }],
          connect: createListOfRoles(updatedValues as UserBasicInfo[]),
        },
      };
    }

    updateWorkshopCard({
      variables: {
        where: {
          uuid: workshopCard.uuid,
        },
        update: changes,
      },
    });
  };

  const handleDelete = () => {
    if (workshopCard.uuid === '') {
      deleteCard(sectionIndex, cardIndex);
    } else {
      deleteWorkshopCard({
        variables: {
          where: { uuid: workshopCard.uuid },
        },
      });
    }

    if (eventData.sections[sectionIndex].uuid === '') {
      deleteSection(sectionIndex);
    }
  };

  useEffect(() => {
    if (!deleteResults.loading && deleteResults.data) {
      console.log('SUCCESSFUL DELETE');
      console.log(deleteResults.data);

      deleteCard(sectionIndex, cardIndex);

      let reorderedCards = reorderCards(
        (eventData.sections[sectionIndex] as IWorkshopsSection).workshopCards
      );

      console.log(reorderedCards);

      for (let i = 0; i < reorderedCards.updatedCards.length; i++) {
        let updatedCard = reorderedCards.updatedCards[i];

        updateWorkshopCard({
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

      let updatedSection = { ...eventData.sections[sectionIndex] } as IWorkshopsSection;
      updatedSection.workshopCards = reorderedCards.sorted;

      updateSection(sectionIndex, updatedSection);
      console.log(eventData);
    }
  }, [deleteResults.loading, deleteResults.data]);

  useEffect(() => {
    if (!updateResults.loading && updateResults.data) {
      console.log('SUCCESSFUL UPDATE');
      console.log(updateResults.data);

      let updatedSection = { ...eventData.sections[sectionIndex] } as IWorkshopsSection;
      const updatedCard = updateResults.data.updateWorkshopCards.workshopCards[0];
      updatedSection.workshopCards[cardIndex] = {
        ...workshopCard,
        teachers: updatedCard.teachers,
        styles: updatedCard.styles?.map((style: any) => style.name),
      };
      updateSection(sectionIndex, updatedSection);
    }
  }, [updateResults.loading, updateResults.data]);

  if (workshopCard.isEditable) {
    return <EditWorkshopCard sectionIndex={sectionIndex} cardIndex={cardIndex} />;
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
      <Group align="flex-start">
        {workshopCard.image && (
          <Image
            src={workshopCard.image}
            alt={`${workshopCard.title} Poster`}
            height={300}
            w="auto"
          />
        )}
        <Stack gap="0">
          <Title order={4}>{workshopCard.title}</Title>
          <TextField
            title="Date & Time"
            value={new Date(workshopCard.date * 1000).toLocaleString()}
          />
          <TextField title="Address" value={workshopCard.address} />
          <TextField title="Cost" value={workshopCard.cost} />
          {workshopCard.styles?.length > 0 && <MultiTextStyleField values={workshopCard.styles} />}
          <MultiTextField
            title="Teachers"
            values={workshopCard.teachers}
            updateEvent={updateEvent}
          />
        </Stack>
        <Video title={workshopCard.title} src={workshopCard.recapSrc} />
      </Group>
    </Card>
  );
}
