import { useState } from 'react';
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
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { TallCard } from '../components/Cards/TallCard';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import testData from '../test-data.json';

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

        <Group justify="center" mt="lg">
          {testData.map((data, index) => (
            <TallCard key={index} cardType="event" {...data} />
          ))}
        </Group>

        <Pagination component={Center} total={10} value={2} onChange={setPage} mt="xl" />
      </Card>
    </BasicAppShell>
  );
}
