import { useState } from 'react';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { IPerformancesSection } from '@/types/types';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
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
  const { eventData, setEventData, updateCard, deleteCard } = useEventContext();

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

  return (
    <Card withBorder radius="md" shadow="sm" h="100%">
      <Group justify="space-between">
        <CloseButton
          onClick={() => deleteCard(sectionIndex, cardIndex)}
          mb="sm"
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />

        <Group>
          <Button
            onClick={() =>
              updateCard(sectionIndex, cardIndex, {
                order: cardIndex,
                uuid: performanceCard.uuid,
                title,
                src: videoSrc,
                dancers,
                isEditable: false,
              })
            }
            color="green"
          >
            Save
          </Button>
          <Button onClick={() => resetFields()}>Reset</Button>
          <Button
            color="red"
            onClick={() => {
              const updatedEvent = { ...eventData };
              (updatedEvent.sections[sectionIndex] as IPerformancesSection).performanceCards[
                cardIndex
              ].isEditable = false;
              setEventData(updatedEvent);
            }}
          >
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
