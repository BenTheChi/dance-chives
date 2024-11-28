import { useState } from 'react';
import { IconCirclePlus, IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Group, Title } from '@mantine/core';
import { IPerformanceCard } from '@/types/types';
import { EditPerformanceCard } from '../Cards/EditPerformanceCard';
import { useEventContext } from '../Providers/EventProvider';

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function EditPerformancesSection({
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
  const [performanceCards, setPerformanceCards] = useState<IPerformanceCard[]>(
    currentSection.performanceCards
  );

  const resetFields = () => {
    setPerformanceCards(currentSection.performanceCards);
  };

  const handleDeleteSection = () => {
    setEditSection(false);
    deleteSection(sectionIndex);
  };

  const addCard = () => {
    const updatedCards = [
      ...performanceCards,
      {
        title: '',
        src: '',
        dancers: [],
      },
    ];
    setPerformanceCards(updatedCards);
  };

  const deleteCard = (cardIndex: number) => {
    const updatedCards = [...performanceCards];
    updatedCards.splice(cardIndex, 1);
    setPerformanceCards(updatedCards);
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
        Performances
      </Title>
      <Group mt="sm" p="0" justify="center" gap="lg">
        {performanceCards.map((performanceCard, index) => {
          return (
            <EditPerformanceCard
              key={index}
              cardIndex={index}
              deleteCard={deleteCard}
              performanceCards={performanceCards}
              setPerformanceCards={setPerformanceCards}
            />
          );
        })}
        <Button onClick={addCard} variant="outline" h="375" w="460">
          <Group align="center" justify="space-between">
            <IconCirclePlus size={100} />
            <Title order={4}>Add Performance</Title>
          </Group>
        </Button>
      </Group>
    </Card>
  );
}
