import { useMutation } from '@apollo/client';
import { Button, Card, Center, Text, TextInput } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { hasLength, isEmail, useForm } from '@mantine/form';
import ImageInputWithPreview from '@/components/Inputs/ImageInputWithPreview';
import { StringsMultiSelectCreatable } from '@/components/Inputs/StringsMultiSelectCreatable';
import { UsersMultiSelect } from '@/components/Inputs/UsersMultiSelect';
import { CREATE_EVENTS } from '@/gql/returnQueries';
import { createListOfRoles } from '@/gql/utilities';
import { UserBasicInfo } from '@/types/types';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

const stylesList = ['Breaking', 'Popping', 'Locking', 'Hip Hop', 'House', 'Waacking'];

export function AddEventPage() {
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      title: '',
      datetime: '',
      addressName: '',
      address: '',
      city: '',
      cost: '',
      prizes: '',
      description: '',
      styles: [] as string[],
      organizers: [] as UserBasicInfo[],
      djs: [] as UserBasicInfo[],
      mcs: [] as UserBasicInfo[],
      videographers: [] as UserBasicInfo[],
      photographers: [] as UserBasicInfo[],
      sponsors: [] as UserBasicInfo[],
      graphicDesigners: [] as UserBasicInfo[],
      recapVideo: '',
      promoVideo: '',
      images: [],
    },
  });

  const [createEvents, { data, loading, error }] = useMutation(CREATE_EVENTS);

  loading! && console.log(data);

  function handleSubmit(submittedValues: typeof form.values) {
    if (submittedValues) {
      const djList = createListOfRoles(submittedValues.djs);
      const organizerList = createListOfRoles(submittedValues.organizers);
      const mcList = createListOfRoles(submittedValues.mcs);
      const videographerList = createListOfRoles(submittedValues.videographers);
      const photographerList = createListOfRoles(submittedValues.photographers);
      const graphicDesignerList = createListOfRoles(submittedValues.graphicDesigners);

      const styleList = submittedValues.styles.map((style) => {
        return {
          where: {
            node: {
              name: style,
            },
          },
          onCreate: {
            node: {
              name: style,
            },
          },
        };
      });

      createEvents({
        variables: {
          input: [
            {
              uuid: crypto.randomUUID(),
              title: submittedValues.title,
              titleSlug: submittedValues.title.toLowerCase().replace(/ /g, '-'),
              date: Math.floor(new Date(submittedValues.datetime).getTime() / 1000).toString(),
              addressName: submittedValues.addressName,
              address: submittedValues.address,
              inCity: {
                connectOrCreate: {
                  where: {
                    node: {
                      name: submittedValues.city,
                    },
                  },
                  onCreate: {
                    node: {
                      name: submittedValues.city,
                      state: 'test',
                      country: 'blah',
                    },
                  },
                },
              },
              djs: {
                connect: djList,
              },
              styles: {
                connect: styleList,
              },
              organizers: {
                connect: organizerList,
              },
              mcs: {
                connect: mcList,
              },
              videographers: {
                connect: videographerList,
              },
              photographers: {
                connect: photographerList,
              },
              graphicDesigners: {
                connect: graphicDesignerList,
              },
              cost: submittedValues.cost,
              prizes: submittedValues.prizes,
              description: submittedValues.description,
              images: submittedValues.images.map((image: File) => image.name),
              recapVideo: submittedValues.recapVideo,
              promoVideo: submittedValues.promoVideo,
            },
          ],
        },
      });
    }
  }

  return (
    <BasicAppShell>
      <DarkModeToggle />

      <form
        onSubmit={form.onSubmit((values) => {
          handleSubmit(values);
        })}
      >
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
            {...form.getInputProps('addressName')}
            label="Venue Name"
            placeholder="ex. Eastside Dance Center"
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
          <StringsMultiSelectCreatable
            value={form.values.styles}
            notExists={stylesList}
            onChange={(value: string[]) => form.setFieldValue('styles', value)}
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
          <ImageInputWithPreview form={form} />
        </Card>

        <Card radius="md" m="md" withBorder>
          <Center>Team</Center>
          <Text>Organizers</Text>
          <UsersMultiSelect
            value={form.values.organizers}
            onChange={(value) => form.setFieldValue('organizers', value)}
          />
          <Text>DJs</Text>
          <UsersMultiSelect
            value={form.values.djs}
            onChange={(value) => form.setFieldValue('djs', value)}
          />
          <Text>MCs</Text>
          <UsersMultiSelect
            value={form.values.mcs}
            onChange={(value) => form.setFieldValue('mcs', value)}
          />
          <Text>Videographers</Text>
          <UsersMultiSelect
            value={form.values.videographers}
            onChange={(value) => form.setFieldValue('videographers', value)}
          />
          <Text>Photographers</Text>
          <UsersMultiSelect
            value={form.values.photographers}
            onChange={(value) => form.setFieldValue('photographers', value)}
          />
          <Text>Graphic Designers</Text>
          <UsersMultiSelect
            value={form.values.graphicDesigners}
            onChange={(value) => form.setFieldValue('graphicDesigners', value)}
          />
        </Card>

        <Button type="submit" mt="md">
          Submit
        </Button>
      </form>
    </BasicAppShell>
  );
}
