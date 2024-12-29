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
  TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IWorkshopsSection } from '@/types/types';
import { EditField } from '../Inputs/EditField';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];

export function EditWorkshopCard({
  sectionIndex,
  cardIndex,
}: {
  sectionIndex: number;
  cardIndex: number;
}) {
  const { eventData, deleteCard, updateCard, updateCardEditable } = useEventContext();
  const workshopCard = (eventData.sections[sectionIndex] as IWorkshopsSection).workshopCards[
    cardIndex
  ];

  const [title, setTitle] = useState(workshopCard.title);
  const [recapSrc, setRecapSrc] = useState(workshopCard.recapSrc);
  const [teachers, setTeachers] = useState(workshopCard.teacher);
  const [date, setDate] = useState(new Date(workshopCard.date * 1000));
  const [address, setAddress] = useState(workshopCard.address);
  const [cost, setCost] = useState(workshopCard.cost);
  const [image, setImage] = useState(workshopCard.image);
  const [styles, setStyles] = useState(workshopCard.styles);
  const [file, setFile] = useState<File | null>(null);

  const resetFields = () => {
    setTitle(workshopCard.title);
    setRecapSrc(workshopCard.recapSrc);
    setTeachers(workshopCard.teacher);
    setDate(new Date(workshopCard.date * 1000));
    setAddress(workshopCard.address);
    setCost(workshopCard.cost);
    setImage(workshopCard.image);
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
                isEditable: false,
                styles,
                title,
                recapSrc,
                teacher: teachers,
                date: date.getTime() / 1000,
                address,
                cost,
                image: file ? file.name : workshopCard.image,
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
          <Text fw="700">Styles:</Text>
          <MultiSelectCreatable notExists={[...styles]} value={styles} onChange={setStyles} />
          <Text fw="700">Teachers:</Text>
          <MultiSelectCreatable
            notExists={[...notExists, ...teachers]}
            value={teachers}
            onChange={setTeachers}
          />
        </Stack>
        <Stack gap="0">
          {recapSrc ? <Video title={title} src={recapSrc} /> : null}
          <Text fw="bold">Recap Video Youtube URL:</Text>
          <TextInput
            value={recapSrc}
            onChange={(event) => setRecapSrc(event.currentTarget.value)}
          />
        </Stack>
      </Group>
    </Card>
  );
}
