import React from 'react';
import { IconCaretDown } from '@tabler/icons-react';
import { StyledFirebaseAuth } from 'react-firebaseui';
import { Link } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Center,
  Divider,
  Menu,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import firebase, { auth } from '../../lib/firebase'; // Import from centralized config
import { UserInfoForm } from '../UserInfoForm';

export function LoginHeader() {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [title, setTitle] = React.useState('Login');
  // const [newUser, ]

  // Configure FirebaseUI.
  const uiConfig = {
    signInFlow: 'popup',
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      // Avoid redirects after sign-in.
      signInSuccessWithAuthResult: (result: any) => {
        setLoggedIn(true);

        //Close modal window
        close();
        console.log(result);
        return false;
      },
    },
  };

  const fullName = 'Ben Chi';

  if (loggedIn) {
    return (
      <>
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
            <Menu.Item
              onClick={() => {
                setLoggedIn(false);
              }}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => {
          setTitle('Login');
          open();
        }}
      >
        Login
      </Button>
      <Button
        onClick={() => {
          setTitle('Sign Up');
          open();
        }}
      >
        Sign Up
      </Button>
      <Modal.Root opened={opened} onClose={close} size="lg">
        <Modal.Overlay />
        <Modal.Content>
          <Modal.CloseButton mt="md" ml="md" />
          <Center>
            <Title order={2}>{title}</Title>
          </Center>

          {title == 'Sign Up' ? (
            <UserInfoForm setTitle={setTitle} />
          ) : (
            <Stack p="lg">
              <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
            </Stack>
          )}
        </Modal.Content>
      </Modal.Root>
    </>
  );
}
