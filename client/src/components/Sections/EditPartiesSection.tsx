import { useState } from 'react';
import { IconCirclePlus, IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Group, Title } from '@mantine/core';
import { IPartyCard } from '@/types/types';
import { EditPartyCard } from '../Cards/EditPartyCard';
import { useEventContext } from '../Providers/EventProvider';

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function EditPartiesSection({
  sectionIndex,
  deleteSection,
  setEditSection,
}: {
  sectionIndex: number;
  deleteSection: (sectionIndex: number) => void;
  setEditSection: (value: boolean) => void;
}) {
  const handleDeleteSection = () => {
    setEditSection(false);
    deleteSection(sectionIndex);
  };

  const { eventData } = useEventContext();

  const currentSection = JSON.parse(JSON.stringify(eventData.sections[sectionIndex]));
  const [partyCards, setPartyCards] = useState<IPartyCard[]>(currentSection.partyCards);

  const resetFields = () => {
    setPartyCards(currentSection.partyCards);
  };

  const addCard = () => {
    const updatedCards = [
      ...partyCards,
      {
        title: '',
        image: '',
        date: 0,
        address: '',
        cost: '',
        dj: [],
      },
    ];
    setPartyCards(updatedCards);
  };

  const deleteCard = (cardIndex: number) => {
    const updatedCards = [...partyCards];
    updatedCards.splice(cardIndex, 1);
    setPartyCards(updatedCards);
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
        Parties
      </Title>
      <Group mt="sm" p="0" justify="center" gap="lg">
        {partyCards.map((partyCard, index) => {
          return (
            <EditPartyCard
              key={index}
              cardIndex={index}
              deleteCard={deleteCard}
              partyCards={partyCards}
              setPartyCards={setPartyCards}
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
