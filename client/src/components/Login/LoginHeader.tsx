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

import { useUserContext } from '../Providers/UserProvider';
import { UserInfoForm } from '../UserInfoForm';

export function LoginHeader() {
  const [opened, { open, close }] = useDisclosure(false);
  const [title, setTitle] = React.useState('Login');
  const { signup, loggedIn, login, logout, register, userData } = useUserContext();

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
        console.log('SUCCESS');
        console.log('Full result:', result);

        // Wait for next tick to ensure Firebase user is fully initialized
        setTimeout(() => {
          // Get current user directly from Firebase
          const currentUser = firebase.auth().currentUser;

          if (currentUser) {
            currentUser
              .getIdToken()
              .then((firebaseToken) => {
                return signup ? register(firebaseToken) : login(firebaseToken, currentUser.uid);
              })
              .then(() => {
                console.log(signup ? 'Registered' : 'Logged in');
              })
              .catch((error) => {
                console.error('Authentication error:', error);
              });
          } else {
            console.error('No current user found');
          }
        }, 1000);

        close();
        return false;
      },
    },
  };

  if (loggedIn) {
    console.log('LOGGED IN');
    console.log(userData);

    return (
      <>
        <Menu trigger="hover" openDelay={100}>
          <Menu.Target>
            <Button variant="outline" h="3.5rem">
              <Avatar
                radius="xl"
                name={userData.fname + ' ' + userData.lname}
                src={userData.image}
                color="orange"
              />
              <IconCaretDown size="1.5rem" stroke={1.5} />
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item component={Link} to={`/profile/${userData.username}`}>
              Profile
            </Menu.Item>
            <Menu.Item component={Link} to="/settings">
              Settings
            </Menu.Item>
            <Menu.Item
              onClick={() => {
                logout();
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
