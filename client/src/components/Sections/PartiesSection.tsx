import { Card, Center, Group, Title } from '@mantine/core';
import { PartyCard } from '../Cards/PartyCard';
import { useEventContext } from '../Providers/EventProvider';

interface PartyCard {
  title: string;
  image: string;
  date: number;
  address: string;
  cost: string;
  dj: string[];
}

interface PartiesSection {
  type: string;
  partyCards: PartyCard[];
}

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function PartiesSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData } = useEventContext();

  const currentSection = eventData.sections[sectionIndex] as PartiesSection;

  return (
    <Card m="md" withBorder>
      <Title component={Center} order={3}>
        Parties
      </Title>
      <Group mt="sm" p="0" justify="center" gap="lg">
        {currentSection.partyCards.map((partyCard, index) => {
          return <PartyCard key={index} cardIndex={index} sectionIndex={sectionIndex} />;
        })}
      </Group>
    </Card>
  );
}
