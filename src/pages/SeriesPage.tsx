import { Button, Group, Text } from '@mantine/core';
import { AutocompleteClearable } from '@/components/Inputs/AutocompleteClearable';
import { EditableField } from '@/components/Inputs/EditableField';
import { MultiSelectCreatable } from '@/components/Inputs/MultiSelectCreatable';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function SeriesPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text size="xl">Series Page</Text>
      <EditableField />
    </BasicAppShell>
  );
}
