import { Link } from 'react-router-dom';
import { Card, Group, Image, Stack, Text } from '@mantine/core';
import { EventCardProps } from '@/types/types';

// import myImage from '../../assets/bookofstyles.jpg';

export function EventCard({ title, date, city, styles, images }: EventCardProps) {
  return (
    <Card
      component={Link}
      to={`/event/${title.toLowerCase().replace(/\s+/g, '-')}`}
      withBorder
      radius="md"
      shadow="sm"
      w="300"
    >
      <Group>
        <Group justify="center" gap="0">
          <Image src={images[0]} alt={title} height={200} w="auto" />
          <Text size="xl" fw={700}>
            {title}
          </Text>
        </Group>
        <Stack gap="0">
          <Text>
            <b>Date:</b> {new Date(date * 1000).toLocaleDateString()}
          </Text>
          <Text>
            <b>City:</b> {city}
          </Text>
          <Text>
            <b>Styles:</b> {styles.join(', ')}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}
