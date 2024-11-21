import { Card, Title } from '@mantine/core';
import { Video } from '../Video';

export function PromoRecapCard({ title, src }: { title: string; src: string }) {
  return (
    <Card withBorder radius="md" shadow="sm" h="400" w="600">
      <Title order={4}>{title}</Title>
      <Video title={title} src={src} />
    </Card>
  );
}
