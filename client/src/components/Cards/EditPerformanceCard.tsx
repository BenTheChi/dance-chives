import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Stack, Text, Textarea, TextInput } from '@mantine/core';
import {
  CREATE_PERFORMANCE_CARD,
  CREATE_PERFORMANCE_SECTION,
  DELETE_PERFORMANCE_CARD,
  UPDATE_PERFORMANCE_CARD,
} from '@/gql/returnQueries';
import { createDeleteListOfBrackets, createListOfRoles } from '@/gql/utilities';
import { IPerformancesSection, UserBasicInfo } from '@/types/types';
import { ObjectComparison, reorderCards } from '@/utilities/utility';
import { UsersMultiSelect } from '../Inputs/UsersMultiSelect';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];

export function EditPerformanceCard({
  sectionIndex,
  cardIndex,
}: {
  sectionIndex: number;
  cardIndex: number;
}) {
  const [createSection, createSectionResults] = useMutation(CREATE_PERFORMANCE_SECTION);
  const [createPerformanceCard, createResults] = useMutation(CREATE_PERFORMANCE_CARD);
  const [deletePerformanceCard, deleteResults] = useMutation(DELETE_PERFORMANCE_CARD);
  const [updatePerformanceCard, updateResults] = useMutation(UPDATE_PERFORMANCE_CARD);

  const { eventData, deleteCard, updateCard, updateCardEditable, updateSection, deleteSection } =
    useEventContext();
  const performanceCard = (eventData.sections[sectionIndex] as IPerformancesSection)
    .performanceCards[cardIndex];

  const [title, setTitle] = useState(performanceCard.title);
  const [videoSrc, setVideoSrc] = useState(performanceCard.src);
  const [dancers, setDancers] = useState(performanceCard.dancers);

  const resetFields = () => {
    setTitle(performanceCard.title);
    setVideoSrc(performanceCard.src);
    setDancers(performanceCard.dancers);
  };

  const handleDelete = () => {
    if (performanceCard.uuid === '') {
      deleteCard(sectionIndex, cardIndex);
    } else {
      deletePerformanceCard({
        variables: {
          where: { uuid: performanceCard.uuid },
        },
      });
    }

    if (eventData.sections[sectionIndex].uuid === '') {
      deleteSection(sectionIndex);
    }
  };

  const handleSubmit = () => {
    //New Section with new card
    if (eventData.sections[sectionIndex].uuid === '') {
      createSection({
        variables: {
          input: [
            {
              order: sectionIndex.toString(),
              uuid: crypto.randomUUID(),
              type: 'performances',
              performanceCardsIn: {
                create: [
                  {
                    node: {
                      order: performanceCard.order.toString(),
                      uuid: crypto.randomUUID(),
                      title,
                      src: videoSrc,
                      dancers: {
                        connect: createListOfRoles(dancers),
                      },
                    },
                  },
                ],
              },
              partOfEvents: {
                connect: { where: { node: { uuid: eventData.uuid } } },
              },
            },
          ],
        },
      });
    }

    // New Card
    if (performanceCard.uuid === '') {
      createPerformanceCard({
        variables: {
          input: [
            {
              order: performanceCard.order.toString(),
              uuid: crypto.randomUUID(),
              title,
              src: videoSrc,
              dancers: {
                connect: createListOfRoles(dancers),
              },
              inPerformanceSection: {
                connect: {
                  where: {
                    node: {
                      uuid: eventData.sections[sectionIndex].uuid,
                    },
                  },
                },
              },
            },
          ],
        },
      });
    } else {
      const changes = ObjectComparison(performanceCard, {
        order: performanceCard.order,
        title,
        src: videoSrc,
        dancers,
      });

      if (Object.keys(changes).length > 0) {
        updatePerformanceCard({
          variables: {
            where: {
              uuid: performanceCard.uuid,
            },
            update: {
              title: changes.title,
              src: changes.src,
              dancers: changes.dancers && {
                disconnect: [{ where: {} }],
                connect: createListOfRoles(dancers),
              },
            },
          },
        });
      }
    }
  };

  const handleCancel = () => {
    if (eventData.sections[sectionIndex].uuid === '') {
      deleteSection(sectionIndex);
    } else if (performanceCard.uuid === '') {
      deleteCard(sectionIndex, cardIndex);
    } else {
      updateCardEditable(sectionIndex, cardIndex, false);
    }
  };

  useEffect(() => {
    if (!createSectionResults.loading && createSectionResults.data) {
      console.log('SUCCESSFUL CREATE SECTION');
      console.log(createSectionResults.data);

      updateCard(sectionIndex, cardIndex, {
        order: performanceCard.order,
        uuid: createSectionResults.data.createSections.sections[0].performanceCardsIn[0].uuid,
        isEditable: false,
        title,
        src: videoSrc,
        dancers,
      });

      let updatedSection = { ...eventData.sections[sectionIndex] } as IPerformancesSection;
      updatedSection.uuid = createSectionResults.data.createSections.sections[0].uuid;
      updateSection(sectionIndex, updatedSection);
    }
  }, [createSectionResults.loading, createSectionResults.data]);

  useEffect(() => {
    if (!createResults.loading && createResults.data) {
      console.log('SUCCESSFUL CREATE CARD');
      console.log(createResults.data);

      updateCard(sectionIndex, cardIndex, {
        order: performanceCard.order,
        uuid: createResults.data.createPerformanceCards.performanceCards[0].uuid,
        isEditable: false,
        title,
        src: videoSrc,
        dancers,
      });
    }
  }, [createResults.loading, createResults.data]);

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
      console.log('SUCCESSFUL UPDATE CARD');
      console.log(updateResults.data);

      updateCard(sectionIndex, cardIndex, {
        order: performanceCard.order,
        uuid: updateResults.data.updatePerformanceCards.performanceCards[0].uuid,
        isEditable: false,
        title,
        src: videoSrc,
        dancers,
      });
    }
  }, [updateResults.loading, updateResults.data]);

  return (
    <Card withBorder radius="md" shadow="sm" h="100%">
      <Group justify="space-between">
        <CloseButton
          onClick={() => handleDelete()}
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
      </Group>

      <Stack gap="0">
        <Text fw="bold">Title:</Text>
        <Textarea
          autosize
          minRows={1}
          w="350"
          pb="sm"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />

        <Stack>
          {videoSrc ? <Video title={title} src={videoSrc} /> : null}
          <Text fw="bold">Performance Youtube URL:</Text>
          <TextInput
            value={videoSrc}
            onChange={(event) => setVideoSrc(event.currentTarget.value)}
          />
        </Stack>

        <Text fw="700">Dancers:</Text>
        <UsersMultiSelect value={dancers} onChange={(value) => setDancers(value)} />
      </Stack>
    </Card>
  );
}
