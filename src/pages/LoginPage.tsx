import { Text } from '@mantine/core';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function LoginPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text>LOGIN CONTENT</Text>
    </BasicAppShell>
  );
}
