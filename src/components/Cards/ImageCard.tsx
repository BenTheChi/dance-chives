import { IconCirclePlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import {
  AspectRatio,
  Button,
  Card,
  Center,
  Group,
  Spoiler,
  Stack,
  Text,
  Title,
} from '@mantine/core';

interface VideoCardProps {
  id?: number;
  src?: string;
  title?: string;
  type: string;
  winner?: string;
  dancers?: string[];
}

export function VideoCard({ id, winner, src, title, type, dancers = [] }: VideoCardProps) {
  if (type === 'event') {
    return (
      <Card withBorder radius="md" shadow="sm" h="100%" w="460">
        <Title order={4}>{title}</Title>
        <AspectRatio ratio={16 / 9}>
          <iframe
            src={src}
            title={title}
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </AspectRatio>
        <Stack gap="0">
          <Text>Dancers: {dancers.join(', ')}</Text>
          <Spoiler maxHeight={1} w="460" showLabel="See Winner" hideLabel="Hide">
            {winner}
          </Spoiler>
        </Stack>
      </Card>
    );
  }
}
