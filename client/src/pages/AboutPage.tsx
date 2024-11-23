import { Text } from '@mantine/core';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function AboutPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text>About CONTENT</Text>
    </BasicAppShell>
  );
}
