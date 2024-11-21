import { Card, Center, Group, Image, Stack, Text, Title } from '@mantine/core';
import myImage from '../assets/bookofstyles.jpg';
import { VideoCard } from '../Cards/VideoCard';
import { WorkshopCard } from '../Cards/WorkshopCard';
import { useEventContext } from '../Providers/EventProvider';

interface WorkshopCard {
  title: string;
  images: string[];
  date: number;
  address: string;
  cost: string;
  styles: string[];
  teacher: string[];
  recapSrc: string;
}

interface WorkshopsSection {
  type: string;
  workshopCards: WorkshopCard[];
}

export function WorkshopsSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData } = useEventContext();

  const currentSection = eventData.sections[sectionIndex] as WorkshopsSection;

  return (
    <Card m="md" withBorder>
      <Title component={Center} order={3}>
        Workshops
      </Title>
      <Group mt="sm" p="0" justify="center" gap="lg">
        {currentSection.workshopCards.map((workshopCard, index) => {
          return <WorkshopCard key={index} cardIndex={index} sectionIndex={sectionIndex} />;
        })}
      </Group>
    </Card>
  );
}
