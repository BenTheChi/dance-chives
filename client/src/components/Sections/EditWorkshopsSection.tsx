import { useState } from 'react';
import { IconCirclePlus, IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Group, Title } from '@mantine/core';
import { IWorkshopCard } from '@/types/types';
import { EditWorkshopCard } from '../Cards/EditWorkshopCard';
import { useEventContext } from '../Providers/EventProvider';

export function EditWorkshopsSection({
  sectionIndex,
  deleteSection,
  setEditSection,
}: {
  sectionIndex: number;
  deleteSection: (sectionIndex: number) => void;
  setEditSection: (value: boolean) => void;
}) {
  const { eventData } = useEventContext();

  const currentSection = JSON.parse(JSON.stringify(eventData.sections[sectionIndex]));
  const [workshopCards, setWorkshopCards] = useState<IWorkshopCard[]>(currentSection.workshopCards);

  const resetFields = () => {
    setWorkshopCards(currentSection.workshopCards);
  };

  const handleDeleteSection = () => {
    setEditSection(false);
    deleteSection(sectionIndex);
  };

  const addCard = () => {
    const updatedCards = [
      ...workshopCards,
      {
        title: '',
        images: [],
        date: 0,
        address: '',
        cost: '',
        styles: [],
        teacher: [],
        recapSrc: '',
      },
    ];
    setWorkshopCards(updatedCards);
  };

  const deleteCard = (cardIndex: number) => {
    const updatedCards = [...workshopCards];
    updatedCards.splice(cardIndex, 1);
    setWorkshopCards(updatedCards);
  };

  return (
    <Card m="md" withBorder>
      <Group justify="space-between">
        <CloseButton
          onClick={handleDeleteSection}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Group>
          <Button color="green">Save</Button>
          <Button onClick={() => resetFields()}>Reset</Button>
          <Button color="red" onClick={() => setEditSection(false)}>
            Cancel
          </Button>
        </Group>
      </Group>
      <Title component={Center} order={3}>
        Workshops
      </Title>
      <Group mt="sm" p="0" justify="center" gap="lg">
        {workshopCards.map((workshopCard, index) => {
          return (
            <EditWorkshopCard
              key={index}
              cardIndex={index}
              deleteCard={deleteCard}
              workshopCards={workshopCards}
              setWorkshopCards={setWorkshopCards}
            />
          );
        })}
        <Button onClick={addCard} variant="outline" h="375" w="460">
          <Group align="center" justify="space-between">
            <IconCirclePlus size={100} />
            <Title order={4}>Add Workshop</Title>
          </Group>
        </Button>
      </Group>
    </Card>
  );
}
