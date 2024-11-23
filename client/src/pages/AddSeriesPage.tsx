import { Text } from '@mantine/core';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function AddSeriesPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text>Add Series Form</Text>
    </BasicAppShell>
  );
}
