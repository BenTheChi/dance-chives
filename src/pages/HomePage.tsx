import { Link } from 'react-router-dom';
import { Button, Center, Divider, Group, Stack, Text } from '@mantine/core';
import { TallCard } from '@/components/Cards/TallCard';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import testData from '../test-data.json';

export function HomePage() {
  return (
    <BasicAppShell>
      <Group justify="space-between">
        <DarkModeToggle />
        <div className="button-group">
          <Button component={Link} to="/add-event" m="sm">
            Add Event
          </Button>
          <Button component={Link} to="/add-series" m="sm">
            Add Series
          </Button>
        </div>
      </Group>
      <Stack>
        <section>
          <Center>
            <Text size="xl" mb="lg" fw="bolder">
              UPCOMING EVENTS
            </Text>
          </Center>
          <Group justify="center">
            {testData.map((data, index) => (
              <TallCard key={index} cardType="event" {...data} />
            ))}
          </Group>
        </section>
        <Divider m="lg" />
        <section>
          <Center>
            <Text size="xl" mb="lg" fw="bolder">
              RECENT EVENTS
            </Text>
          </Center>
          <Group justify="center">
            {testData.map((data, index) => (
              <TallCard key={index} cardType="event" {...data} />
            ))}
          </Group>
        </section>
        <Divider m="lg" />
        <section>
          <Center>
            <Text size="xl" mb="lg" fw="bolder">
              FEATURED SERIES
            </Text>
          </Center>
          <Group justify="center">
            {testData.map((data, index) => (
              <TallCard key={index} cardType="series" {...data} />
            ))}
          </Group>
        </section>
      </Stack>
    </BasicAppShell>
  );
}
