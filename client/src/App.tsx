import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  createHttpLink,
  InMemoryCache,
} from '@apollo/client';
import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { theme } from './theme';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/', // Replace with your GraphQL server URL
});

const omitTypenameLink = new ApolloLink((operation, forward) => {
  if (forward === undefined) return null;

  return forward(operation).map((response) => {
    const removeTypename = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(removeTypename);
      }
      if (obj && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
          if (key !== '__typename') {
            newObj[key] = removeTypename(obj[key]);
          }
        }
        return newObj;
      }
      return obj;
    };

    return removeTypename(response);
  });
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([omitTypenameLink, httpLink]),
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
