import { useState } from 'react';
import { Button, Card, Stack, TextInput, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';

export function UserInfoForm() {
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      username: '',
      firstname: '',
      lastname: '',
      dob: '',
      city: '',
      email: '',
      password: '',
      authCode: '',
    },
    // validate: {
    //   name: hasLength({ min: 3 }, 'Must be at least 3 characters'),
    //   email: isEmail('Invalid email'),
    // },
  });

  const [submittedValues, setSubmittedValues] = useState<typeof form.values | null>(null);

  function handleClick() {
    console.log(submittedValues);
  }

  return (
    <Card>
      <Title>Register</Title>
      <form onSubmit={form.onSubmit(setSubmittedValues)}>
        <Stack>
          <TextInput
            {...form.getInputProps('firstname')}
            label="First Name"
            placeholder="Enter your firstname"
            required
          />
          <TextInput
            {...form.getInputProps('lastname')}
            label="Last Name"
            placeholder="Enter your lastname"
            required
          />
          <TextInput
            {...form.getInputProps('username')}
            label="User Name (This will be displayed to other users)"
            placeholder="Enter your username"
            required
          />
        </Stack>
        <Stack>
          <DateInput
            {...form.getInputProps('dob')}
            valueFormat="MM/DD/YYYY"
            label="Date of Birth"
            placeholder="MM/DD/YYYY"
            required
          />
          <TextInput
            {...form.getInputProps('city')}
            label="City"
            placeholder="Enter your city"
            required
          />
          <TextInput
            {...form.getInputProps('authCode')}
            label="Auth Code Priviledges (Leave blank if you don't have one)"
            placeholder="Enter your auth code"
          />
        </Stack>

        <Button type="submit" mt="md" onClick={handleClick}>
          Submit
        </Button>
      </form>
    </Card>
  );
}
