import { Text } from '@mantine/core';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function CommunityPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text>EVENTS CONTENT</Text>
    </BasicAppShell>
  );
}