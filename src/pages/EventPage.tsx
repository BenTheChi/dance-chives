import { Button, Card, Center, Group, Image, Paper, Stack, Text, Title } from '@mantine/core';
import { VideoCard } from '@/components/Cards/VideoCard';
import { GenericSection } from '@/components/EventSection/GenericSection';
import { PromoRecapSection } from '@/components/EventSection/PromoRecapSection';
import { WorkshopSection } from '@/components/EventSection/WorkshopSection';
import myImage from '../assets/bookofstyles.jpg';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { BattlesSection } from '../components/EventSection/BattlesSection';

// import { PartySection } from '../components/EventSection/PartySection';

export function EventPage() {
  //Pull this from a DB
  const eventInstance = {
    id: 1,
    title: 'Book of Styles',
    date: 1546300800,
    city: 'Seattle',
    styles: ['Locking', 'Waacking', 'Popping', 'Breaking', 'House', 'Hip Hop'],
    organizer: 'Seattle Dance Collective',
    location: '123 Fake Street, Seattle, WA',
    src: 'https://www.youtube.com/embed/JKQ83Bo9g3s?si=qcgBwu5YOdVDfLj0',
    dancers: ['Heartbreaker', 'Hong 10'],
    winner: 'Hong 10',
  };

  return (
    <BasicAppShell>
      <DarkModeToggle />
      {/* Use unstyled TextInput for edits */}
      <Paper shadow="xs" radius="xl" withBorder p="md" bg="gray">
        <Group align="flex-start" m="md">
          <Image src={myImage} alt="Book of Styles" height={300} w="auto" />
          <Stack gap="1" align="flex-start">
            <Title order={2}>{eventInstance.title}</Title>
            <Text>Date: {new Date(eventInstance.date * 1000).toLocaleDateString()}</Text>
            <Text>City: {eventInstance.city}</Text>
            <Text>Organizer: {eventInstance.organizer}</Text>
            <Text>Location: {eventInstance.location}</Text>
            <Text>Styles: {eventInstance.styles.join(', ')}</Text>

            <Group mt="xl">
              <Button>Edit</Button>
              <Button>Delete</Button>
            </Group>
          </Stack>
          {/* <Card>
            <Title component={Center} order={3}>
              Performance/Workshop/Showcases
            </Title>
            <Group mt="sm" p="0" justify="center" gap="lg">
              <VideoCard type="event" {...eventInstance} />
              <VideoCard type="add" {...eventInstance} />
            </Group>
          </Card> */}
        </Group>
      </Paper>
    </BasicAppShell>
  );
}
