import { ReactNode } from 'react';
// Initialize Firebase
import { Link } from 'react-router-dom';
import { AppShell, Burger, Group, Image, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { LoginHeader } from '../Login/LoginHeader';
import { NavBar } from './NavBar';

export function BasicAppShell({ children }: { children: ReactNode }) {
  const [mobileOpened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 100 }}
      navbar={{ width: 200, breakpoint: 'sm', collapsed: { mobile: !mobileOpened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="md">
          <Link to="/">
            <Image src="/src/assets/ChivesLogoTransparent.png" height="75px" ml="lg" />
          </Link>
          {/* Hide this when in mobile view */}
          <Text ml="lg" size="40px" className="desktop-view">
            Dance Chives: Your #1 Street Dance Resource
          </Text>
          <Group>
            <LoginHeader />
            <Burger opened={mobileOpened} onClick={toggle} hiddenFrom="sm" size="sm" />
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
