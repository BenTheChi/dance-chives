import { Center, Group, Text } from '@mantine/core';
import { TallCard } from '@/components/Cards/TallCard';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import testData from '../test-data.json';

export function HomePage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Center>
        <Text size="xl">UPCOMING EVENTS</Text>
      </Center>
      <Group justify="center">
        {testData.map((data, index) => (
          <TallCard key={index} cardType="event" {...data} />
        ))}
      </Group>
    </BasicAppShell>
  );
}
