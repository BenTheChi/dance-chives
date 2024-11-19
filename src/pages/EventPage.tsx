import { Link } from 'react-router-dom';
import { Button, Card, Center, Group, Image, Paper, Pill, Stack, Text, Title } from '@mantine/core';
import { VideoCard } from '@/components/Cards/VideoCard';
import { GenericSection } from '@/components/EventSection/GenericSection';
import { PromoRecapSection } from '@/components/EventSection/PromoRecapSection';
import { WorkshopSection } from '@/components/EventSection/WorkshopSection';
import { MultiSelectCreatable } from '@/components/Inputs/MultiSelectCreatable';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { BattlesSection } from '../components/EventSection/BattlesSection';
import eventInstance from '../single-event-test.json';

// import { PartySection } from '../components/EventSection/PartySection';

const allUsers = ['user1', 'user2', 'user3', 'user4', 'user5'];

export function EventPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      {/* Use unstyled TextInput for edits */}
      <Title order={2} ml="md">
        {eventInstance.title}
      </Title>

      <Group align="flex-start" m="md">
        <Image
          src={'/src/images/' + eventInstance.images[0]}
          alt={`${eventInstance.title} Poster`}
          height={500}
          w="auto"
        />
        <Stack gap="1" align="flex-start" w="600px">
          <Group gap="6px">
            <Text fw="700">Date: </Text>{' '}
            <Text> {new Date(eventInstance.date * 1000).toLocaleDateString()}</Text>
          </Group>

          <Group gap="6px">
            <Text fw="700">City: </Text> <Text>{eventInstance.city}</Text>
          </Group>

          <Group gap="6px">
            <Text fw="700">Cost: </Text> <Text>{eventInstance.cost}</Text>
          </Group>

          <Group gap="6px">
            <Text fw="700">Prizes: </Text> <Text>{eventInstance.prizes}</Text>
          </Group>

          <Group gap="6px">
            <Text fw="700">Description: </Text> <Text>{eventInstance.description}</Text>
          </Group>
          {eventInstance.organizersExists || eventInstance.organizersNotExists ? (
            <Group gap="6px">
              <Text fw="700">Organizer:</Text>
              {eventInstance.organizersExists.map((organizer) => (
                <Link to="/user/#">{organizer}</Link>
              ))}
              {eventInstance.organizersNotExists.map((organizer) => (
                <Text>{organizer}</Text>
              ))}
            </Group>
          ) : null}

          {eventInstance.mcs ? (
            <Group gap="6px">
              <Text fw="700">MC:</Text>
              {eventInstance.mcs.map((mc) => (
                <Link to="/user/#">{mc}</Link>
              ))}
            </Group>
          ) : null}

          {eventInstance.djs ? (
            <Group gap="6px">
              <Text fw="700">DJ:</Text>
              {eventInstance.djs.map((dj) => (
                <Link to="/user/#">{dj}</Link>
              ))}
            </Group>
          ) : null}

          <Group gap="6px">
            <Text fw="700">Location: </Text> <Text>{eventInstance.address}</Text>
          </Group>

          {eventInstance.styles ? (
            <Group gap="6px">
              <Text fw="700">Styles:</Text>
              {eventInstance.styles.map((style) => (
                <Link to="/education/#">{style}</Link>
              ))}
            </Group>
          ) : null}

          {eventInstance.videographers ? (
            <Group gap="6px">
              <Text fw="700">Videographer:</Text>
              {eventInstance.videographers.map((videographer) => (
                <Link to="/user/#">{videographer}</Link>
              ))}
            </Group>
          ) : null}

          {eventInstance.photographers ? (
            <Group gap="6px">
              <Text fw="700">Photographer:</Text>
              {eventInstance.photographers.map((photographer) => (
                <Link to="/user/#">{photographer}</Link>
              ))}
            </Group>
          ) : null}

          {eventInstance.sponsors ? (
            <Group gap="6px">
              <Text fw="700">Sponsor:</Text>
              {eventInstance.sponsors.map((sponsor) => (
                <Link to="/user/#">{sponsor}</Link>
              ))}
            </Group>
          ) : null}

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
    </BasicAppShell>
  );
}
