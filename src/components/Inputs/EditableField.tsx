import { Button, Group } from '@mantine/core';
import { AutocompleteClearable } from './AutocompleteClearable';
import { MultiSelectCreatable } from './MultiSelectCreatable';

const exists = ['Jacob', 'William', 'Olivia'];
const notExists = [
  'John',
  'Steve',
  'Alice',
  'Emma',
  'Ava',
  'Sophia',
  'Isabella',
  'Mia',
  'Charlotte',
  'Amelia',
  'Harper',
  'Evelyn',
  'Abigail',
  'Emily',
  'Ella',
  'Elizabeth',
  'Camila',
  'Luna',
  'Sofia',
  'Avery',
];

const roles = ['Dancer', 'DJ', 'MC', 'Judge', 'Organizer', 'Sponsor', 'Volunteer'];

export function EditableField() {
  return (
    <Group>
      <AutocompleteClearable roles={roles} />
      <MultiSelectCreatable exists={exists} notExists={notExists} />
      <Button>Submit</Button>
    </Group>
  );
}
