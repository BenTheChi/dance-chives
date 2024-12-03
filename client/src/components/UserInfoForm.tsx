import { useState } from 'react';
import { Button, Card, Center, Stack, TextInput, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';

export function UserInfoForm({ setTitle }: { setTitle: (title: string) => void }) {
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
    // Optional: Add validations if needed
    // validate: {
    //   username: (value) => value.length < 3 ? 'Username must be at least 3 characters' : null,
    //   // Add other validations
    // }
  });

  const handleSubmit = (values: typeof form.values) => {
    // Handle form submission here
    console.log(values);
    // setSubmittedValues(values);
    setTitle('Choose login method');
  };

  return (
    <Card mr="120" ml="120" mt="xl" mb="xl" p="xl">
      <form
        onSubmit={(event) => {
          event.preventDefault(); // Prevent default form submission
          form.onSubmit(handleSubmit)(event); // Correctly handle form submission
        }}
      >
        <Stack gap="md" mb="lg">
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
            label="Auth Code Privileges (Leave blank if you don't have one)"
            placeholder="Enter your auth code"
          />
        </Stack>
        <Center>
          <Button type="submit">Submit</Button>
        </Center>
      </form>
    </Card>
  );
}
