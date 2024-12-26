import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import {
  Autocomplete,
  Button,
  Card,
  Center,
  Checkbox,
  Group,
  Pagination,
  Paper,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IEventCard, IEventCards } from '@/types/types';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { EventCard } from '../components/Cards/EventCard';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

// import testData from '../test-data.json';

interface GQLEventCard {
  __typename: string;
  uuid: string;
  title: string;
  date: number;
  images: string[];
  inCity: {
    __typename: string;
    name: string;
    state: string;
    country: string;
  };
  stylesFeaturedIn: {
    __typename: string;
    name: string;
  }[];
  hasBattle: boolean;
  hasWorkshop: boolean;
  hasPerformance: boolean;
  hasParty: boolean;
}

export function EventsPage() {
  const [activePage, setPage] = useState(1);
  const [startValue, setStartValue] = useState<Date | null>(new Date());
  const [endValue, setEndValue] = useState<Date | null>(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
  const [titleValue, setTitleValue] = useState<string>('');
  const [cityValue, setCityValue] = useState<string>('');
  const [stylesValue, setStyleValue] = useState<string>('');
  const [hasWorkshop, setHasWorkshop] = useState(false);
  const [hasParty, setHasParty] = useState(false);

  function convertGQL(events: GQLEventCard[]): IEventCards {
    return {
      events: events.map((event) => {
        return {
          id: event.uuid,
          title: event.title,
          date: event.date,
          city: event.inCity.name,
          styles: event.stylesFeaturedIn.map((style) => style.name),
          images: event.images,
          hasBattle: event.hasBattle,
          hasParty: event.hasParty,
          hasWorkshop: event.hasWorkshop,
          hasPerformance: event.hasPerformance,
        };
      }),
    };
  }

  const submitSearch = () => {
    console.log('Search submitted');
  };

  const cities = [
    'New York',
    'Los Angeles',
    'Chicago',
    'Houston',
    'Phoenix',
    'Philadelphia',
    'San Antonio',
    'San Diego',
    'Dallas',
    'San Jose',
  ];

  const styles = [
    'Open Styles',
    'Waacking',
    'Popping',
    'Locking',
    'Breaking',
    'House',
    'Vogue',
    'Hip Hop',
    'Krump',
  ];

  const getEventsQuery = gql`
    query GetEvent {
      events {
        uuid
        title
        date
        images
        inCity {
          name
        }
        stylesFeaturedIn {
          name
        }
        hasBattle
        hasPerformance
        hasWorkshop
        hasParty
      }
    }
  `;

  let eventsData: IEventCards | undefined;
  const { loading, data, error } = useQuery(getEventsQuery);

  if (!loading) {
    eventsData = convertGQL(data.events);
  }

  if (loading || !eventsData) {
    return <div>Loading...</div>;
  }

  return (
    <BasicAppShell>
      <Group justify="space-between">
        <DarkModeToggle />
        <Button component={Link} to="/add-event" m="sm">
          Add Event
        </Button>
      </Group>
      <Center mb="lg">
        <Title size="h1">Events</Title>
      </Center>
      <Card p="lg">
        <Group align="center" justify="center">
          <Group align="flex-start">
            <Paper component={Group} withBorder p="md" radius="md">
              <TextInput
                value={titleValue}
                onChange={(event) => setTitleValue(event.currentTarget.value)}
                label="Title"
                placeholder="Search"
              />
              <Autocomplete
                value={stylesValue}
                onChange={setStyleValue}
                label="Style"
                placeholder="Select style"
                data={styles}
              />
              <Autocomplete
                value={cityValue}
                onChange={setCityValue}
                label="City"
                placeholder="Select city"
                data={cities}
              />
            </Paper>
            <Paper component={Group} withBorder p="md" radius="md">
              <DateInput
                value={startValue}
                onChange={setStartValue}
                valueFormat="MM/DD/YYYY"
                label="From"
                placeholder="Start Date"
              />
              <DateInput
                value={endValue}
                onChange={setEndValue}
                valueFormat="MM/DD/YYYY"
                label="To"
                placeholder="End Date"
              />
            </Paper>
            <Paper component={Group} withBorder p="xs" radius="md" h="94.8">
              <Checkbox
                mt="xs"
                label="Has Workshop?"
                size="md"
                checked={hasWorkshop}
                onChange={(event) => setHasWorkshop(event.currentTarget.checked)}
              />
              <Checkbox
                mt="xs"
                label="Has Party?"
                size="md"
                checked={hasParty}
                onChange={(event) => setHasParty(event.currentTarget.checked)}
              />
            </Paper>
          </Group>
          <Button w="400" onClick={submitSearch} variant="filled" color="blue">
            Search
          </Button>
        </Group>

        <Group justify="center" mt="40px">
          {eventsData &&
            eventsData.events.map((data, index) => <EventCard key={index} {...data} />)}
        </Group>

        <Pagination component={Center} total={10} value={activePage} onChange={setPage} mt="xl" />
      </Card>
    </BasicAppShell>
  );
}
