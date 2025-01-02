import { useState } from 'react';
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
import { IPartiesSection } from '@/types/types';
import { EditField } from '../Inputs/EditField';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
import { useEventContext } from '../Providers/EventProvider';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];

export function EditPartyCard({
  sectionIndex,
  cardIndex,
}: {
  sectionIndex: number;
  cardIndex: number;
}) {
  const { eventData, updateCardEditable, deleteCard, updateCard } = useEventContext();
  const partyCard = (eventData.sections[sectionIndex] as IPartiesSection).partyCards[cardIndex];

  const [title, setTitle] = useState(partyCard.title);
  const [djs, setDJs] = useState(partyCard.dj);
  const [date, setDate] = useState(new Date(partyCard.date * 1000));
  const [address, setAddress] = useState(partyCard.address);
  const [cost, setCost] = useState(partyCard.cost);
  const [image, setImage] = useState(partyCard.image);
  const [file, setFile] = useState<File | null>(null);

  const resetFields = () => {
    setTitle(partyCard.title);
    setDJs(partyCard.dj);
    setDate(new Date(partyCard.date * 1000));
    setAddress(partyCard.address);
    setCost(partyCard.cost);
    setImage(partyCard.image);
    setFile(null);
  };

  return (
    <Card withBorder radius="md" shadow="sm" h="100%">
      <Group justify="space-between">
        <CloseButton
          onClick={() => deleteCard(sectionIndex, cardIndex)}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Group>
          <Button
            onClick={() =>
              updateCard(sectionIndex, cardIndex, {
                order: cardIndex,
                uuid: partyCard.uuid,
                isEditable: false,
                title,
                dj: djs,
                date: date.getTime() / 1000,
                address,
                cost,
                image: file ? file.name : partyCard.image,
              })
            }
            color="green"
          >
            Save
          </Button>
          <Button onClick={() => resetFields()}>Reset</Button>
          <Button color="red" onClick={() => updateCardEditable(sectionIndex, cardIndex, false)}>
            Cancel
          </Button>
        </Group>
      </Group>
      <Group align="flex-start">
        <Stack>
          {image && <Image src={image} height={300} w="auto" />}

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
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />

          <Text fw="bold">Date & Time:</Text>
          <DateTimePicker
            pb="sm"
            onChange={(newDate) => setDate(newDate || new Date())}
            defaultValue={new Date(date)}
            clearable
          />

          <EditField title="Address" value={address} onChange={setAddress} />
          <EditField title="Cost" value={cost} onChange={setCost} />

          <Text fw="700">DJs:</Text>
          <MultiSelectCreatable notExists={[...notExists, ...djs]} value={djs} onChange={setDJs} />
        </Stack>
      </Group>
    </Card>
  );
}
