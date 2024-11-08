import React from 'react';
import { IconMoonFilled, IconMoonOff } from '@tabler/icons-react';
import { Button, Group, MantineColorScheme, useMantineColorScheme } from '@mantine/core';

export function DarkModeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const [darkScheme, setDarkScheme] = React.useState<MantineColorScheme>('light');

  return (
    <Group justify="left">
      <Button
        variant="outline"
        radius="xl"
        onClick={() => {
          darkScheme === 'light'
            ? setDarkScheme('dark' as MantineColorScheme)
            : setDarkScheme('light' as MantineColorScheme);
          setColorScheme(darkScheme);
        }}
      >
        {darkScheme === 'light' ? <IconMoonOff /> : <IconMoonFilled />}
      </Button>
    </Group>
  );
}
