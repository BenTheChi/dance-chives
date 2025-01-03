import { useEffect, useReducer } from 'react';
import { useMutation } from '@apollo/client';
import { Button, FileButton, Group, Image, Stack, Text, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { UPDATE_EVENTS } from '@/gql/returnQueries';
import {
  createConnectOrCreateListOfRoles,
  createConnectOrCreateListOfStyles,
} from '@/gql/utilities';
import { ObjectComparison } from '@/utilities/utility';
import { EditField } from '../Inputs/EditField';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];
const allStyles = ['Breaking', 'Popping', 'Locking', 'Hip Hop', 'House', 'Waacking', 'Vogue'];

export function EditEventSection({ setEditEvent }: { setEditEvent: (value: boolean) => void }) {
  const { eventData, updateEventData } = useEventContext();

  const actionTypes = [
    'SET_IMAGES',
    'SET_DATE',
    'SET_CITY',
    'SET_COST',
    'SET_PRIZES',
    'SET_DESCRIPTION',
    'SET_ADDRESS',
    'SET_PROMOVIDEO',
    'SET_RECAPVIDEO',
    'SET_ORGANIZERS',
    'SET_MCS',
    'SET_DJS',
    'SET_VIDEOGRAPHERS',
    'SET_PHOTOGRAPHERS',
    'SET_STYLES',
    'RESET_FIELDS',
  ];

  function reducer(state: typeof eventData, action: { type: string; payload?: any }) {
    if (action.type === 'RESET_FIELDS') return eventData;
    if (actionTypes.includes(action.type)) {
      return { ...state, [action.type.toLowerCase().replace('set_', '')]: action.payload };
    }
    return state;
  }

  const [updateEvents, { data, loading, error }] = useMutation(UPDATE_EVENTS);
  const [state, dispatch] = useReducer(reducer, eventData);

  function convertGQL(event: any) {
    let newData = event;

    newData.city = newData.inCity.name;

    newData.organizers?.length &&
      (newData.organizers = newData.organizers.map((organizer: any) => organizer.displayName));
    newData.mcs?.length && (newData.mcs = newData.mcs.map((mc: any) => mc.displayName));
    newData.djs?.length && (newData.djs = newData.djs.map((dj: any) => dj.displayName));
    newData.videographers?.length &&
      (newData.videographers = newData.videographers.map(
        (videographer: any) => videographer.displayName
      ));
    newData.photographers?.length &&
      (newData.photographers = newData.photographers.map(
        (photographer: any) => photographer.displayName
      ));
    newData.styles?.length && (newData.styles = newData.styles.map((style: any) => style.name));

    return newData;
  }

  useEffect(() => {
    if (!loading && data) {
      updateEventData(convertGQL(data.updateEvents.events[0]));
      setEditEvent(false);
    }
  }, [loading, data]);

  const resetFields = () => {
    dispatch({ type: 'RESET_FIELDS' });
  };

  function handleSubmit() {
    const changes = ObjectComparison(eventData, state);
    const roles = ['organizers', 'mcs', 'djs', 'videographers', 'photographers'];

    roles.forEach((role) => {
      if (changes[role]) {
        const roleList = createConnectOrCreateListOfRoles(changes[role]);

        changes[role] = {
          disconnect: [{ where: {} }],
          connectOrCreate: roleList,
        };
      }
    });

    if (changes.styles) {
      changes.styles = {
        disconnect: [{ where: {} }],
        connectOrCreate: createConnectOrCreateListOfStyles(changes.styles),
      };
    }

    updateEvents({
      variables: {
        where: {
          uuid: eventData.uuid,
        },
        update: changes,
      },
    });
  }

  return (
    <div>
      {/* Use unstyled TextInput for edits */}
      <Title order={2} ml="md">
        {eventData.title}
      </Title>
      <Group align="flex-start" m="md">
        <Stack>
          {eventData.images && (
            <Image
              src={eventData.images[0]}
              alt={`${eventData.title} Poster`}
              height={300}
              w="auto"
            />
          )}

          <FileButton
            onChange={(file) => dispatch({ type: 'SET_FILE', payload: file })}
            accept="image/png,image/jpeg"
          >
            {(props) => <Button {...props}>Upload image</Button>}
          </FileButton>
        </Stack>

        <Stack>
          <Stack gap="0">
            {state.recapVideo ? <Video title="Recap" src={state.recapVideo} /> : null}
            <Text fw="bold">Recap Video Youtube URL:</Text>
            <TextInput
              value={state.recapVideo}
              onChange={(event) =>
                dispatch({ type: 'SET_RECAPVIDEO', payload: event.currentTarget.value })
              }
            />
          </Stack>

          <Stack gap="0">
            {state.promoVideo ? <Video title="Promo" src={state.promoVideo} /> : null}
            <Text fw="bold">Promo Video Youtube URL:</Text>
            <TextInput
              value={state.promoVideo}
              onChange={(event) =>
                dispatch({ type: 'SET_PROMOVIDEO', payload: event.currentTarget.value })
              }
            />
          </Stack>
        </Stack>
        <Stack gap="1" align="flex-start">
          <Text fw="bold">Date & Time:</Text>
          <DateTimePicker
            pb="sm"
            onChange={(newDate) => dispatch({ type: 'SET_DATE', payload: newDate || new Date() })}
            defaultValue={new Date(state.date * 1000)}
            clearable
          />

          <EditField
            title="City"
            value={state.city}
            onChange={(value) => dispatch({ type: 'SET_CITY', payload: value })}
          />
          <EditField
            title="Cost"
            value={state.cost}
            onChange={(value) => dispatch({ type: 'SET_COST', payload: value })}
          />
          <EditField
            title="Prizes"
            value={state.prizes}
            onChange={(value) => dispatch({ type: 'SET_PRIZES', payload: value })}
          />
          <EditField
            title="Address"
            value={state.address}
            onChange={(value) => dispatch({ type: 'SET_ADDRESS', payload: value })}
          />
          <EditField
            title="Description"
            value={state.description}
            onChange={(value) => dispatch({ type: 'SET_DESCRIPTION', payload: value })}
          />
        </Stack>
        <Stack gap="0">
          <Text fw="700">Organizer:</Text>
          <MultiSelectCreatable
            notExists={[...notExists, ...state.organizers]}
            value={state.organizers}
            onChange={(value) => dispatch({ type: 'SET_ORGANIZERS', payload: value })}
          />

          <Text fw="700">MC:</Text>
          <MultiSelectCreatable
            notExists={notExists}
            value={state.mcs}
            onChange={(value) => dispatch({ type: 'SET_MCS', payload: value })}
          />

          <Text fw="700">DJ:</Text>
          <MultiSelectCreatable
            notExists={notExists}
            value={state.djs}
            onChange={(value) => dispatch({ type: 'SET_DJS', payload: value })}
          />

          <Text fw="700">Videographer:</Text>
          <MultiSelectCreatable
            notExists={notExists}
            value={state.videographers}
            onChange={(value) => dispatch({ type: 'SET_VIDEOGRAPHERS', payload: value })}
          />

          <Text fw="700">Photographer:</Text>
          <MultiSelectCreatable
            notExists={notExists}
            value={state.photographers}
            onChange={(value) => dispatch({ type: 'SET_PHOTOGRAPHERS', payload: value })}
          />

          <Text fw="700">Styles:</Text>
          <MultiSelectCreatable
            notExists={allStyles}
            value={state.styles}
            onChange={(value) => dispatch({ type: 'SET_STYLES', payload: value })}
          />
        </Stack>

        <Stack mt="md">
          <Button color="green" onClick={() => handleSubmit()}>
            Save
          </Button>
          <Button onClick={() => resetFields()}>Reset</Button>
          <Button color="red" onClick={() => setEditEvent(false)}>
            Cancel
          </Button>
        </Stack>
      </Group>
    </div>
  );
}
