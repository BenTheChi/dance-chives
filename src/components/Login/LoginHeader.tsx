import React from 'react';
import { IconCaretDown } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Menu } from '@mantine/core';

export function LoginHeader() {
  const [loggedIn, setLoggedIn] = React.useState(true);

  const fullName = 'Ben Chi';

  if (loggedIn) {
    return (
      <Menu trigger="hover" openDelay={100}>
        <Menu.Target>
          <Button variant="outline" h="3.5rem">
            <Avatar radius="xl" name={fullName} color="orange" />
            <IconCaretDown size="1.5rem" stroke={1.5} />
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item component={Link} to="/profile">
            Profile
          </Menu.Item>
          <Menu.Item component={Link} to="/settings">
            Settings
          </Menu.Item>
          <Menu.Item component={Link} to="/logout">
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Button component={Link} to="/login">
      {' '}
      Login / Sign Up{' '}
    </Button>
  );
}
