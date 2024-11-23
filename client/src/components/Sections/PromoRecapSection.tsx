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

export function PromoRecapSection(promo: VideoCardProps, recap: VideoCardProps, title: string) {
  return (
    <Card>
      <Title component={Center} order={3}>
        {title}
      </Title>
      <Group mt="sm" p="0" justify="center" gap="lg">
        {promo ? <VideoCard {...promo} /> : <VideoCard type="add-promo" />}
        {recap ? <VideoCard {...recap} /> : <VideoCard type="add-recap" />}
      </Group>
    </Card>
  );
}
