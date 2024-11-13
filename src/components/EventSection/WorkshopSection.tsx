import { Card, Center, Group, Image, Stack, Text, Title } from '@mantine/core';
import myImage from '../assets/bookofstyles.jpg';
import { VideoCard } from '../Cards/VideoCard';

interface VideoCardProps {
  id?: number;
  src?: string;
  title?: string;
  type: string;
  winner?: string;
  dancers?: string[];
}

interface VideosProps {
  videos: VideoCardProps[] | null;
}

export function WorkshopSection({ videos }: VideosProps, title: string, poster: string) {
  return (
    <Card>
      <Title component={Center} order={3}>
        {title}
      </Title>
      <Group>
        <Image src={poster} alt="Book of Styles" height={300} w="auto" />
        <Stack>
          <Text>Cost: $10</Text>
          <Text>Teacher: Mt. Pop</Text>
          <Text>Date: 12/31/2021</Text>
          <Text>Location: 10:00 AM</Text>
        </Stack>
      </Group>
      <Group mt="sm" p="0" justify="center" gap="lg">
        {videos && videos.map((data: VideoCardProps) => <VideoCard {...data} />)}
        <VideoCard type="add" />
      </Group>
    </Card>
  );
}
