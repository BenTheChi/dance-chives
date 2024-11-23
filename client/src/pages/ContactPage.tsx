import { Text } from '@mantine/core';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function ContactPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text>CONTACT CONTENT</Text>
    </BasicAppShell>
  );
}
