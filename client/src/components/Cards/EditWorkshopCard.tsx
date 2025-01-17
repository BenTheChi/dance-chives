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
import {
  CREATE_WORKSHOP_CARD,
  CREATE_WORKSHOP_SECTION,
  DELETE_WORKSHOP_CARD,
  UPDATE_WORKSHOP_CARD,
} from '@/gql/returnQueries';
import {
  createConnectOrCreateListOfStyles,
  createDeleteListOfBrackets,
  createDeleteListOfStyles,
  createListOfRoles,
} from '@/gql/utilities';
import { IWorkshopsSection, UserBasicInfo } from '@/types/types';
import { buildMutation, ObjectComparison, reorderCards } from '@/utilities/utility';
import { EditField } from '../Inputs/EditField';
import { StringsMultiSelectCreatable } from '../Inputs/StringsMultiSelectCreatable';
import { UsersMultiSelect } from '../Inputs/UsersMultiSelect';
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
  const { eventData, deleteCard, updateCard, updateCardEditable, updateSection, deleteSection } =
    useEventContext();
  const workshopCard = (eventData.sections[sectionIndex] as IWorkshopsSection).workshopCards[
    cardIndex
  ];

  const [createSection, createSectionResults] = useMutation(CREATE_WORKSHOP_SECTION);
  const [deleteWorkshopCard, deleteResults] = useMutation(DELETE_WORKSHOP_CARD);
  const [createWorkshopCard, createResults] = useMutation(CREATE_WORKSHOP_CARD);
  const [updateWorkshopCard, updateResults] = useMutation(UPDATE_WORKSHOP_CARD);

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

  const handleDelete = () => {
    if (workshopCard.uuid === '') {
      deleteCard(sectionIndex, cardIndex);
    } else {
      deleteWorkshopCard({
        variables: {
          where: { uuid: workshopCard.uuid },
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
              type: 'workshops',
              workshopCardsIn: {
                create: [
                  {
                    node: {
                      order: workshopCard.order.toString(),
                      uuid: crypto.randomUUID(),
                      title,
                      recapSrc,
                      date: Math.floor(new Date(date).getTime() / 1000).toString(),
                      address,
                      cost,
                      image,
                      teachers: {
                        connect: createListOfRoles(teachers),
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
              order: workshopCard.order.toString(),
              uuid: crypto.randomUUID(),
              title,
              recapSrc,
              date: Math.floor(new Date(date).getTime() / 1000).toString(),
              address,
              cost,
              image,
              teachers: {
                connect: createListOfRoles(teachers),
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

    //Update existing Card
    else {
      const changes = ObjectComparison(workshopCard, {
        title,
        recapSrc,
        date,
        address,
        cost,
        image,
        teachers,
        styles: styles,
      });

      // const teachersMutation = changes.teachers
      //   ? buildMutation(workshopCard.teachers || [], changes.teachers || [])
      //   : { toCreate: [], toDelete: [] };

      const stylesMutation = changes.styles
        ? buildMutation(workshopCard.styles || [], changes.styles || [])
        : { toCreate: [], toDelete: [] };

      updateWorkshopCard({
        variables: {
          where: {
            uuid: workshopCard.uuid,
          },
          update: {
            title,
            recapSrc,
            date: Math.floor(new Date(date).getTime() / 1000).toString(),
            address,
            cost,
            image,
            teachers: {
              disconnect: [{ where: {} }],
              connect: createListOfRoles(teachers),
            },
            styles: {
              connectOrCreate: createConnectOrCreateListOfStyles(stylesMutation.toCreate),
              delete: createDeleteListOfStyles(stylesMutation.toDelete),
            },
          },
        },
      });
    }
  };

  const handleCancel = () => {
    if (eventData.sections[sectionIndex].uuid === '') {
      deleteSection(sectionIndex);
    } else if (workshopCard.uuid === '') {
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
        order: cardIndex,
        uuid: createSectionResults.data.createSections.sections[0].workshopCardsIn[0].uuid,
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

      let updatedSection = { ...eventData.sections[sectionIndex] } as IWorkshopsSection;
      updatedSection.uuid = createSectionResults.data.createSections.sections[0].uuid;
      updateSection(sectionIndex, updatedSection);
    }
  }, [createSectionResults.loading, createSectionResults.data]);

  useEffect(() => {
    if (!createResults.loading && createResults.data) {
      console.log('SUCCESSFUL CREATE CARD');
      console.log(createResults.data);

      updateCard(sectionIndex, cardIndex, {
        order: workshopCard.order,
        uuid: createResults.data.createWorkshopCards.workshopCards[0].uuid,
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

  useEffect(() => {
    if (!deleteResults.loading && deleteResults.data) {
      console.log('SUCCESSFUL DELETE');
      console.log(deleteResults.data);

      deleteCard(sectionIndex, cardIndex);

      let reorderedCards = reorderCards(
        (eventData.sections[sectionIndex] as IWorkshopsSection).workshopCards
      );

      console.log(reorderedCards);

      for (let i = 0; i < reorderedCards.updatedCards.length; i++) {
        let updatedCard = reorderedCards.updatedCards[i];

        updateWorkshopCard({
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

      let updatedSection = { ...eventData.sections[sectionIndex] } as IWorkshopsSection;
      updatedSection.workshopCards = reorderedCards.sorted;

      updateSection(sectionIndex, updatedSection);
      console.log(eventData);
    }
  }, [deleteResults.loading, deleteResults.data]);

  useEffect(() => {
    if (!updateResults.loading && updateResults.data) {
      console.log('SUCCESSFUL UPDATE CARD');
      console.log(updateResults.data);

      updateCard(sectionIndex, cardIndex, {
        order: workshopCard.order,
        uuid: updateResults.data.updateWorkshopCards.workshopCards[0].uuid,
        isEditable: false,
        styles,
        title,
        recapSrc,
        teachers,
        date,
        address,
        cost,
        image: file ? file.name : workshopCard.image,
      });
    }
  }, [updateResults.loading, updateResults.data]);

  return (
    <Card withBorder radius="md" shadow="sm" h="100%" w="100%">
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
          <StringsMultiSelectCreatable
            notExists={[...stylesList, ...styles]}
            value={styles}
            onChange={setStyles}
          />
          <Text fw="700">Teachers:</Text>
          <UsersMultiSelect value={teachers} onChange={(value) => setTeachers(value)} />
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
