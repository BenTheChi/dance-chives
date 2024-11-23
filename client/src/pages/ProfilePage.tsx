import { Text } from '@mantine/core';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function ProfilePage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text>PROFILE CONTENT</Text>
    </BasicAppShell>
  );
}
