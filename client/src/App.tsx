import '@mantine/core/styles.css';

import { MantineProvider, Text } from '@mantine/core';
import { Router } from './Router';
import { theme } from './theme';

import '@mantine/dates/styles.css';

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <Router />
    </MantineProvider>
  );
}