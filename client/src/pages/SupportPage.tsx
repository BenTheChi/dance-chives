import { Text } from '@mantine/core';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function SupportPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text>SUPPORT CONTENT</Text>
    </BasicAppShell>
  );
}
