import { Text } from '@mantine/core';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function AddEventPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text>ADD EVENT FORM</Text>
    </BasicAppShell>
  );
}
