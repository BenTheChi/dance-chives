import { AspectRatio, Card, Group, Image, Stack, Text, Title } from '@mantine/core';
import { MultiTextField } from '../Display/MultiTextField';
import { TextField } from '../Display/TextField';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';

interface WorkshopCard {
  title: string;
  images: string[];
  date: number;
  address: string;
  cost: string;
  styles: string[];
  teacher: string[];
  recapSrc: string;
}

interface WorkshopsSection {
  type: string;
  workshopCards: WorkshopCard[];
}

export function WorkshopCard({
  cardIndex,
  sectionIndex,
}: {
  cardIndex: number;
  sectionIndex: number;
}) {
  const { eventData } = useEventContext();
  const card = (eventData.sections[sectionIndex] as WorkshopsSection).workshopCards[cardIndex];

  return (
    <Card withBorder radius="md" shadow="sm" h="100%">
      <Group align="flex-start">
        <Image
          src={'/src/images/' + card.images[0]}
          alt={`${card.title} Poster`}
          height={300}
          w="auto"
        />
        <Stack gap="0">
          <Title order={4}>{card.title}</Title>
          <TextField title="Date & Time" value={new Date(card.date * 1000).toLocaleString()} />
          <TextField title="Address" value={card.address} />
          <TextField title="Cost" value={card.cost} />
          {card.styles?.length > 0 && <MultiTextField title="Styles" values={card.styles} />}
          {card.styles?.length > 0 && <MultiTextField title="Teachers" values={card.teacher} />}
        </Stack>
        <Video title={card.title} src={card.recapSrc} />
      </Group>
    </Card>
  );
}
