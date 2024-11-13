import { Card, Center, Group, Image, Stack, Text, Title } from '@mantine/core';
import { AddCard } from '../Cards/AddCard';
import { VideoCard } from '../Cards/VideoCard';

interface VideoCardProps {
  id: number;
  src?: string;
  title?: string;
  type: string;
  winner?: string;
  dancers?: string[];
  videographer?: string;
}

interface ImageCardProps {
  id: number;
  src?: string;
  title?: string;
  type: string;
  dancers?: string[];
  graphicDesigner?: string;
}

interface EventSectionProps {
  title: string;
  description: string;
  type: string;
  videoCards: VideoCardProps[] | null;
  imageCards: ImageCardProps[] | null;
}

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function GenericSection({
  videoCards,
  imageCards,
  type,
  title,
  description,
}: EventSectionProps) {
  return (
    <Card>
      <Title component={Center} order={3}>
        {title}
      </Title>
      <Text>Description: This is a generic section.</Text>
      <Group mt="sm" p="0" justify="center" gap="lg">
        {/* {videos && videos.map((data: VideoCardProps) => <VideoCard {...data} />)} */}
        <AddCard type="video" />
        <AddCard type="image" />
      </Group>
    </Card>
  );
}
