import { useState } from 'react';
import { Button, Card, Center, FileInput, Text, TextInput } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { hasLength, isEmail, useForm } from '@mantine/form';
import { MultiSelectCreatable } from '../components/Inputs/MultiSelectCreatable';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

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

const stylesList = ['Breaking', 'Popping', 'Locking', 'Hip Hop', 'House', 'Waacking'];

export function AddEventPage() {
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      title: '',
      datetime: '',
      address: '',
      city: '',
      cost: '',
      prizes: '',
      description: '',
      styles: [],
      organizers: [],
      djs: [],
      mcs: [],
      videographers: [],
      photographers: [],
      sponsors: [],
      graphicDesigners: [],
      recapVideo: '',
      promoVideo: '',
      images: [],
    },
    // validate: {
    //   name: hasLength({ min: 3 }, 'Must be at least 3 characters'),
    //   email: isEmail('Invalid email'),
    // },
  });

  const [submittedValues, setSubmittedValues] = useState<typeof form.values | null>(null);

  console.log(submittedValues);

  return (
    <BasicAppShell>
      <DarkModeToggle />

      <form onSubmit={form.onSubmit(setSubmittedValues)}>
        <Card radius="md" m="md" withBorder>
          <Center>Event Info</Center>
          <TextInput
            {...form.getInputProps('title')}
            label="Title (required)"
            placeholder="ex. Freestyle Session"
          />
          <DateTimePicker
            {...form.getInputProps('datetime')}
            label="Date & Time (required)"
            placeholder="ex. 2023-12-31 18:00"
          />
          <TextInput
            {...form.getInputProps('address')}
            label="Address"
            placeholder="ex. 123 Dance St."
          />
          <TextInput
            {...form.getInputProps('city')}
            label="City (required)"
            placeholder="ex. Los Angeles"
          />
          <TextInput {...form.getInputProps('cost')} label="Cost" placeholder="ex. $20" />
          <TextInput {...form.getInputProps('prizes')} label="Prizes" placeholder="ex. $1000" />
          <TextInput
            {...form.getInputProps('description')}
            label="Description"
            placeholder="Freestyle session is a celebration of breaking and Hip Hop culture"
          />
          <Text>Styles</Text>
          <MultiSelectCreatable
            value={[]}
            notExists={stylesList}
            {...form.getInputProps('styles')}
          />
        </Card>

        <Card radius="md" m="md" withBorder>
          <Center>Media</Center>
          <TextInput
            {...form.getInputProps('promoVideo')}
            label="Promo Video"
            placeholder="www.youtube.com/watch?v=yyyyy"
          />
          <TextInput
            {...form.getInputProps('recapVideo')}
            label="Recap Video"
            placeholder="www.youtube.com/watch?v=xxxxxx"
          />
          <FileInput
            {...form.getInputProps('images')}
            label="Upload images"
            placeholder="Upload images"
            multiple
          />
        </Card>

        <Card radius="md" m="md" withBorder>
          <Center>Team</Center>
          <Text>Organizers</Text>
          <MultiSelectCreatable
            value={[]}
            notExists={notExists}
            {...form.getInputProps('organizers')}
          />
          <Text>DJ's</Text>
          <MultiSelectCreatable value={[]} notExists={notExists} {...form.getInputProps('djs')} />
          <Text>MC's</Text>
          <MultiSelectCreatable value={[]} notExists={notExists} {...form.getInputProps('mcs')} />
          <Text>Videographers</Text>
          <MultiSelectCreatable
            value={[]}
            notExists={notExists}
            {...form.getInputProps('videographers')}
          />
          <Text>Photographers</Text>
          <MultiSelectCreatable
            value={[]}
            notExists={notExists}
            {...form.getInputProps('photographers')}
          />
          <Text>Sponsors</Text>
          <MultiSelectCreatable
            value={[]}
            notExists={notExists}
            {...form.getInputProps('sponsors')}
          />
          <Text>Graphic Designers</Text>
          <MultiSelectCreatable
            value={[]}
            notExists={notExists}
            {...form.getInputProps('graphicDesigners')}
          />
        </Card>

        <Button type="submit" mt="md">
          Submit
        </Button>
      </form>
    </BasicAppShell>
  );
}
