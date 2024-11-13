import { Card, Center, Group, Image, Stack, Text, Title } from '@mantine/core';
import { VideoCard } from '../Cards/VideoCard';

interface VideoCardProps {
  id?: number;
  src?: string;
  title?: string;
  type: string;
  winner?: string;
  dancers?: string[];
}

interface PartyProps {
  //   posters:
}

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function PartySection(posters: PartyProps, title: string) {
  return (
    <Card>
      <Title component={Center} order={3}>
        {title}
      </Title>
      <Text>Description: This is a generic section.</Text>
      <Group mt="sm" p="0" justify="center" gap="lg">
        {/* {videos && videos.map((data: VideoCardProps) => <VideoCard {...data} />)} */}
        <VideoCard type="add" />
      </Group>
    </Card>
  );
}
