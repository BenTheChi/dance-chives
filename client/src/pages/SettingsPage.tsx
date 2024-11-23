import { Text } from '@mantine/core';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function SettingsPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text>Settings CONTENT</Text>
    </BasicAppShell>
  );
}
