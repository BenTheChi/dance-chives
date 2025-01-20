import { Button, Group, Text } from '@mantine/core';
import { MultiSelectCreatable } from '@/components/Inputs/StringsMultiSelectCreatable';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function SeriesPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text size="xl">Series Page</Text>
    </BasicAppShell>
  );
}
