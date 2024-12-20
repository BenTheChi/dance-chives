import { IconSquareXFilled } from '@tabler/icons-react';
import {
  Button,
  Card,
  CloseButton,
  FileButton,
  Group,
  Image,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IPartyCard } from '@/types/types';
import { EditField } from '../Inputs/EditField';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];

export function EditPartyCard({
  cardIndex,
  deleteCard,
  partyCards,
  setPartyCards,
}: {
  cardIndex: number;
  deleteCard: (index: number) => void;
  partyCards: IPartyCard[];
  setPartyCards: (value: IPartyCard[]) => void;
}) {
  const partyCard = partyCards[cardIndex];
  const updateCard = (update: Partial<typeof partyCard>) => {
    const updatedPartyCard = [...partyCards];
    updatedPartyCard[cardIndex] = { ...partyCard, ...update };
    setPartyCards(updatedPartyCard);
  };

  const setTitle = (title: string) => updateCard({ title });
  const setDJs = (dj: string[]) => updateCard({ dj });
  const setDate = (date: Date) => updateCard({ date: date.getTime() / 1000 });
  const setAddress = (address: string) => updateCard({ address });
  const setCost = (cost: string) => updateCard({ cost });
  const setFile = (file: File | null) => {
    if (file) {
      updateCard({ image: file.name });
    }
  };

  return (
    <Card withBorder radius="md" shadow="sm" h="100%">
      <CloseButton
        onClick={() => deleteCard(cardIndex)}
        mb="sm"
        icon={<IconSquareXFilled size={40} stroke={1.5} />}
      />

      <Group align="flex-start">
        <Stack>
          {partyCard.image && (
            <Image src={partyCard.image} alt={`${partyCard.title} Poster`} height={300} w="auto" />
          )}

          <FileButton onChange={setFile} accept="image/png,image/jpeg">
            {(props) => <Button {...props}>Upload image</Button>}
          </FileButton>
        </Stack>

        <Stack gap="0">
          <Text fw="bold">Title:</Text>
          <Textarea
            autosize
            minRows={1}
            w="350"
            pb="sm"
            value={partyCard.title}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />

          <Text fw="bold">Date & Time:</Text>
          <DateTimePicker
            pb="sm"
            onChange={(newDate) => setDate(newDate || new Date())}
            defaultValue={new Date(partyCard.date * 1000)}
            clearable
          />

          <EditField title="Address" value={partyCard.address} onChange={setAddress} />
          <EditField title="Cost" value={partyCard.cost} onChange={setCost} />

          <Text fw="700">DJs:</Text>
          <MultiSelectCreatable
            notExists={[...notExists, ...partyCard.dj]}
            value={partyCard.dj}
            onChange={setDJs}
          />
        </Stack>
      </Group>
    </Card>
  );
}
