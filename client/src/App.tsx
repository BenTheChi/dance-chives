import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { ApolloClient, ApolloProvider, createHttpLink, InMemoryCache } from '@apollo/client';
import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { theme } from './theme';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/', // Replace with your GraphQL server URL
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <MantineProvider theme={theme}>
        <Router />
      </MantineProvider>
    </ApolloProvider>
  );
}
