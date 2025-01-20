import { Button, Card, Center, Stack, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import CountryCitySelector from './Inputs/CountryCitySelector';
import { useUserContext } from './Providers/UserProvider';

export function UserInfoForm({ setTitle }: { setTitle: (title: string) => void }) {
  const { setInitialUserData } = useUserContext();

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      username: '',
      displayName: '',
      fname: '',
      lname: '',
      dob: '',
      city: { name: '', country: '' },
      email: '',
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
    const convertedDob = new Date(values.dob).getTime();
    setInitialUserData({ ...values, dob: convertedDob });
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
            {...form.getInputProps('fname')}
            label="First Name"
            placeholder="Enter your firstname"
            required
          />
          <TextInput
            {...form.getInputProps('lname')}
            label="Last Name"
            placeholder="Enter your lastname"
            required
          />
          <TextInput
            {...form.getInputProps('displayName')}
            label="Display Name (This will be displayed to other users in tags.  Non Unique.  Case sensitive.)"
            placeholder="Enter your display name"
            required
          />
          <TextInput
            {...form.getInputProps('username')}
            label="Username (This will be used for your profile URL.  Unique.  Case insensitive.)"
            placeholder="Enter your display name"
            required
          />
          <TextInput
            {...form.getInputProps('email')}
            label="Email"
            placeholder="Enter your email"
            type="email"
            required
          />
          <DateInput
            {...form.getInputProps('dob')}
            valueFormat="MM/DD/YYYY"
            label="Date of Birth"
            placeholder="MM/DD/YYYY"
            required
          />
          <CountryCitySelector
            selectedCountry={form.values.city.country}
            selectedCity={form.values.city.name}
            onChange={(name, country) => {
              form.setFieldValue('city', { name, country });
            }}
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
