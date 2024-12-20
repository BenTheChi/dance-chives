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
  TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IWorkshopCard } from '@/types/types';
import { EditField } from '../Inputs/EditField';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
import { Video } from '../Video';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];

export function EditWorkshopCard({
  cardIndex,
  deleteCard,
  workshopCards,
  setWorkshopCards,
}: {
  cardIndex: number;
  deleteCard: (index: number) => void;
  workshopCards: IWorkshopCard[];
  setWorkshopCards: (value: IWorkshopCard[]) => void;
}) {
  const workshopCard = workshopCards[cardIndex];
  const updateCard = (update: Partial<typeof workshopCard>) => {
    const updatedWorkshopCards = [...workshopCards];
    updatedWorkshopCards[cardIndex] = { ...workshopCard, ...update };
    setWorkshopCards(updatedWorkshopCards);
  };

  const setTitle = (title: string) => updateCard({ title });
  const setVideoSrc = (src: string) => updateCard({ recapSrc: src });
  const setTeachers = (teacher: string[]) => updateCard({ teacher });
  const setDate = (date: Date) => updateCard({ date: date.getTime() / 1000 });
  const setAddress = (address: string) => updateCard({ address });
  const setCost = (cost: string) => updateCard({ cost });
  const setFile = (file: File | null) => {
    if (file) {
      updateCard({ images: [file.name] });
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
          {workshopCard.images && <Image src={workshopCard.images[0]} height={300} w="auto" />}

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
            value={workshopCard.title}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />

          <Text fw="bold">Date & Time:</Text>
          <DateTimePicker
            pb="sm"
            onChange={(newDate) => setDate(newDate || new Date())}
            defaultValue={new Date(workshopCard.date * 1000)}
            clearable
          />

          <EditField title="Address" value={workshopCard.address} onChange={setAddress} />
          <EditField title="Cost" value={workshopCard.cost} onChange={setCost} />

          <Text fw="700">Teachers:</Text>
          <MultiSelectCreatable
            notExists={[...notExists, ...workshopCard.teacher]}
            value={workshopCard.teacher}
            onChange={setTeachers}
          />
        </Stack>
        <Stack gap="0">
          {workshopCard.recapSrc ? (
            <Video title={workshopCard.title} src={workshopCard.recapSrc} />
          ) : null}
          <Text fw="bold">Recap Video Youtube URL:</Text>
          <TextInput
            value={workshopCard.recapSrc}
            onChange={(event) => setVideoSrc(event.currentTarget.value)}
          />
        </Stack>
      </Group>
    </Card>
  );
}
