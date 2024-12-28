import { useState } from 'react';
import { Button, Card, Group, Spoiler, Stack, Text, Title } from '@mantine/core';
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
  const { eventData, setEventData } = useEventContext();

  const card = (eventData.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex]
    .battleCards[cardIndex];

  if (!card.isEditable)
    return (
      <Card withBorder radius="md" shadow="sm" h="100%" w="460">
        <Group justify="right">
          <Button
            onClick={() => {
              const updatedEvent = { ...eventData };
              (updatedEvent.sections[sectionIndex] as IBattlesSection).brackets[
                bracketIndex
              ].battleCards[cardIndex].isEditable = true;
              setEventData(updatedEvent);
            }}
          >
            Edit
          </Button>
        </Group>
        <Title order={4}>{card.title}</Title>
        <Video title={card.title} src={card.src} />
        <Stack>
          {card.dancers?.length > 0 && <MultiTextField title="Dancers" values={card.dancers} />}
          <Spoiler maxHeight={1} w="460" showLabel="See Winners" hideLabel="Hide">
            {card.winners?.length > 0 && <MultiTextField title="Winners" values={card.winners} />}
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
