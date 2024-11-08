import { Box, Card, Group, Image, Stack, Text } from '@mantine/core';
import myImage from './bookofstyles.jpg';

interface TallCardProps {
  title: string;
  date: number;
  city: string;
  styles: string[];
  cardType: string;
}

export function TallCard({ cardType, title, date, city, styles }: TallCardProps) {
  return (
    <Card component="a" href="/cardType" withBorder radius="md" shadow="sm" w="300">
      <Group>
        <Group justify="center" gap="0">
          <Image src={myImage} alt="Book of Styles" height={200} w="auto" />
          <Text size="xl" fw={700}>
            {title}
          </Text>
        </Group>
        <Stack gap="0">
          <Text>
            <b>Date:</b> {new Date(date).toLocaleDateString()}
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
