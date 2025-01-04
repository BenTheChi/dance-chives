import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
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
import { CREATE_WORKSHOP_CARD, CREATE_WORKSHOP_SECTION } from '@/gql/returnQueries';
import {
  createConnectOrCreateListOfRoles,
  createConnectOrCreateListOfStyles,
} from '@/gql/utilities';
import { IWorkshopsSection } from '@/types/types';
import { EditField } from '../Inputs/EditField';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';

const stylesList = ['Breaking', 'Popping', 'Locking', 'Hip Hop', 'House', 'Waacking'];

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

  const [createSection, createSectionResults] = useMutation(CREATE_WORKSHOP_SECTION);
  // const [deleteWorkshopCard, deleteResults] = useMutation(DELETE_WORKSHOP_CARD);
  const [createWorkshopCard, createResults] = useMutation(CREATE_WORKSHOP_CARD);
  // const [updateWorkshopCard, updateResults] = useMutation(UPDATE_WORKSHOP_CARD);

  const [title, setTitle] = useState(workshopCard.title);
  const [recapSrc, setRecapSrc] = useState(workshopCard.recapSrc);
  const [teachers, setTeachers] = useState(workshopCard.teachers);
  const [date, setDate] = useState(workshopCard.date);
  const [address, setAddress] = useState(workshopCard.address);
  const [cost, setCost] = useState(workshopCard.cost);
  const [image, setImage] = useState(workshopCard.image);
  const [styles, setStyles] = useState(workshopCard.styles);
  const [file, setFile] = useState<File | null>(null);

  const resetFields = () => {
    setTitle(workshopCard.title);
    setRecapSrc(workshopCard.recapSrc);
    setTeachers(workshopCard.teachers);
    setDate(workshopCard.date);
    setAddress(workshopCard.address);
    setCost(workshopCard.cost);
    setImage(workshopCard.image);
    setFile(null);
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
              type: 'workshops',
              workshopCardsIn: {
                create: [
                  {
                    node: {
                      order: cardIndex.toString(),
                      uuid: crypto.randomUUID(),
                      title,
                      recapSrc,
                      date: (new Date(date).getTime() / 1000).toString(),
                      address,
                      cost,
                      image,
                      teachers: {
                        connectOrCreate: createConnectOrCreateListOfRoles(teachers),
                      },
                      styles: {
                        connectOrCreate: createConnectOrCreateListOfStyles(styles),
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

    //Just new Card
    else if (workshopCard.uuid === '') {
      createWorkshopCard({
        variables: {
          input: [
            {
              order: cardIndex.toString(),
              uuid: crypto.randomUUID(),
              title,
              recapSrc,
              date: (new Date(date).getTime() / 1000).toString(),
              address,
              cost,
              image,
              teachers: {
                connectOrCreate: createConnectOrCreateListOfRoles(teachers),
              },
              styles: {
                connectOrCreate: createConnectOrCreateListOfStyles(styles),
              },
              inSections: {
                connect: { where: { node: { uuid: eventData.sections[sectionIndex].uuid } } },
              },
            },
          ],
        },
      });
    }
  };

  useEffect(() => {
    if (!createSectionResults.loading && createSectionResults.data) {
      console.log('SUCCESSFUL CREATE SECTION');
      console.log(createSectionResults.data);

      updateCard(sectionIndex, cardIndex, {
        order: cardIndex,
        uuid: workshopCard.uuid,
        isEditable: false,
        styles,
        title,
        recapSrc,
        teachers,
        date: date,
        address,
        cost,
        image: file ? file.name : workshopCard.image,
      });
    }
  }, [createSectionResults.loading, createSectionResults.data]);

  useEffect(() => {
    if (!createResults.loading && createResults.data) {
      console.log('SUCCESSFUL CREATE');
      console.log(createResults.data);

      updateCard(sectionIndex, cardIndex, {
        order: cardIndex,
        uuid: workshopCard.uuid,
        isEditable: false,
        styles,
        title,
        recapSrc,
        teachers,
        date: date,
        address,
        cost,
        image: file ? file.name : workshopCard.image,
      });
    }
  }, [createResults.loading, createResults.data]);

  return (
    <Card withBorder radius="md" shadow="sm" h="100%" w="100%">
      <Group justify="space-between">
        <CloseButton
          onClick={() => deleteCard(sectionIndex, cardIndex)}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Group>
          <Button onClick={() => handleSubmit()} color="green">
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
            onChange={(newDate) => setDate(newDate ? newDate.getTime() : new Date().getTime())}
            defaultValue={new Date(date * 1000)}
            clearable
          />

          <EditField title="Address" value={address} onChange={setAddress} />
          <EditField title="Cost" value={cost} onChange={setCost} />
          <Text fw="700">Styles:</Text>
          <MultiSelectCreatable
            notExists={[...stylesList, ...styles]}
            value={styles}
            onChange={setStyles}
          />
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
