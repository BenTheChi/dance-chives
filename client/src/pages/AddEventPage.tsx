import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Button, Card, Center, FileInput, Text, TextInput } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { hasLength, isEmail, useForm } from '@mantine/form';
import ImageInputWithPreview from '@/components/Inputs/ImageInputWithPreview';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { MultiSelectCreatable } from '../components/Inputs/MultiSelectCreatable';

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
      addressName: '',
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

  const CREATE_EVENTS = gql`
    mutation CreateEvents($input: [EventCreateInput!]!) {
      createEvents(input: $input) {
        events {
          uuid
          title
          date
          addressName
          address
          cost
          prizes
          description
          recapVideo
          images
          inCity {
            name
            state
            country
          }
          styles {
            name
          }
          organizers {
            displayName
          }
          djs {
            displayName
          }
          mcs {
            displayName
          }
          videographers {
            displayName
          }
          photographers {
            displayName
          }
          graphicDesigners {
            displayName
          }
        }
      }
    }
  `;

  // const [submittedValues, setSubmittedValues] = useState<typeof form.values | null>(null);
  const [createEvents, { data, loading, error }] = useMutation(CREATE_EVENTS);

  loading! && console.log(data);

  function handleSubmit(submittedValues: typeof form.values) {
    if (submittedValues) {
      //inCity: {
      //  create: {
      //   node: {
      //     name: submittedValues.city,
      //     state: 'test',
      //     country: 'blah'
      //   }
      // }
      // },
      const createConnectOrCreateList = (people: String[], role: String) => {
        return people.map((person, index) => {
          return {
            where: {
              node: {
                displayName: person,
              },
            },
            onCreate: {
              node: {
                uuid: `123-454aa6-3cs67${role}${index}`,
                email: '',
                displayName: person,
                dob: '0',
              },
            },
          };
        });
      };

      const djList = createConnectOrCreateList(submittedValues.djs, 'dj');
      const organizerList = createConnectOrCreateList(submittedValues.organizers, 'org');
      const mcList = createConnectOrCreateList(submittedValues.mcs, 'mc');
      const videographerList = createConnectOrCreateList(submittedValues.videographers, 'vid');
      const photographerList = createConnectOrCreateList(submittedValues.photographers, 'photo');
      const graphicDesignerList = createConnectOrCreateList(submittedValues.graphicDesigners, 'gd');

      const styleList = submittedValues.styles.map((style, index) => {
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
              uuid: '123-456-2367',
              title: submittedValues.title,
              titleSlug: submittedValues.title.toLowerCase().replace(/ /g, '-'),
              date: (new Date(submittedValues.datetime).getTime() / 1000).toString(),
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
                connectOrCreate: djList,
              },
              styles: {
                connectOrCreate: styleList,
              },
              organizers: {
                connectOrCreate: organizerList,
              },
              mcs: {
                connectOrCreate: mcList,
              },
              videographers: {
                connectOrCreate: videographerList,
              },
              photographers: {
                connectOrCreate: photographerList,
              },
              graphicDesigners: {
                connectOrCreate: graphicDesignerList,
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
          <ImageInputWithPreview form={form} />
        </Card>

        <Card radius="md" m="md" withBorder>
          <Center>Team</Center>
          <Text>Organizers</Text>
          <MultiSelectCreatable
            value={[]}
            notExists={notExists}
            {...form.getInputProps('organizers')}
          />
          <Text>DJs</Text>
          <MultiSelectCreatable value={[]} notExists={notExists} {...form.getInputProps('djs')} />
          <Text>MCs</Text>
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
