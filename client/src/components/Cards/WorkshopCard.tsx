import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Image, Stack, Title } from '@mantine/core';
import { IWorkshopsSection } from '@/types/types';
import { MultiTextField } from '../Display/MultiTextField';
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
  const { eventData, deleteCard, updateCardEditable } = useEventContext();
  const card = (eventData.sections[sectionIndex] as IWorkshopsSection).workshopCards[cardIndex];

  if (card.isEditable) {
    return <EditWorkshopCard sectionIndex={sectionIndex} cardIndex={cardIndex} />;
  }
  return (
    <Card withBorder radius="md" shadow="sm" h="100%">
      <Group justify="space-between">
        <CloseButton
          onClick={() => deleteCard(sectionIndex, cardIndex)}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Group justify="right">
          <Button onClick={() => updateCardEditable(sectionIndex, cardIndex, true)}>Edit</Button>
        </Group>
      </Group>
      <Group align="flex-start">
        {card.image && (
          <Image src={card.image} alt={`${card.title} Poster`} height={300} w="auto" />
        )}
        <Stack gap="0">
          <Title order={4}>{card.title}</Title>
          <TextField title="Date & Time" value={new Date(card.date * 1000).toLocaleString()} />
          <TextField title="Address" value={card.address} />
          <TextField title="Cost" value={card.cost} />
          {card.styles?.length > 0 && <MultiTextField title="Styles" values={card.styles} />}
          {card.teacher?.length > 0 && <MultiTextField title="Teachers" values={card.teacher} />}
        </Stack>
        <Video title={card.title} src={card.recapSrc} />
      </Group>
    </Card>
  );
}
