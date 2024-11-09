import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Autocomplete,
  Button,
  Card,
  Center,
  Checkbox,
  Group,
  Paper,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export function EventsPage() {
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
      <Card>
        <Group align="center" justify="space-between">
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
      </Card>
    </BasicAppShell>
  );
}
