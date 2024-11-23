import { Text } from '@mantine/core';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function EducationPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <Text>EDUCATION CONTENT</Text>
    </BasicAppShell>
  );
}
