import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AppShell, Burger, Group, Image, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { LoginHeader } from '../Login/LoginHeader';
import { NavBar } from './NavBar';

export function BasicAppShell({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 100 }}
      navbar={{ width: 200, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="md">
          <Link to="/">
            <Image src="src/assets/ChivesLogoTransparent.png" height="75px" ml="lg" />
          </Link>
          {/* Hide this when in mobile view */}
          <Text ml="lg" size="70px" className="desktop-view">
            Dance Chives
          </Text>
          <Group>
            <LoginHeader />
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="lg">
        <NavBar />
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
