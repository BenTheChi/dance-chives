import { Text } from '@mantine/core';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function SignUpPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text>SIGN UP CONTENT</Text>
    </BasicAppShell>
  );
}
