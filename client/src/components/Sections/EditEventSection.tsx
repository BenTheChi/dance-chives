import { useReducer } from 'react';
import { Button, FileButton, Group, Image, Stack, Text, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { EditField } from '../Inputs/EditField';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];
const allStyles = ['Breaking', 'Popping', 'Locking', 'Hip Hop', 'House', 'Waacking', 'Vogue'];

export function EditEventSection({ setEditEvent }: { setEditEvent: (value: boolean) => void }) {
  const { eventData } = useEventContext();

  const initialState = {
    file: null,
    date: new Date(eventData.date * 1000),
    city: eventData.city,
    cost: eventData.cost,
    prizes: eventData.prizes,
    description: eventData.description,
    address: eventData.address,
    promovideo: eventData.promoVideo,
    recapvideo: eventData.recapVideo,
    organizers: eventData.organizers,
    mcs: eventData.mcs,
    djs: eventData.djs,
    videographers: eventData.videographers,
    photographers: eventData.photographers,
    styles: eventData.styles,
  };

  const actionTypes = [
    'SET_FILE',
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

  function reducer(state: typeof initialState, action: { type: string; payload?: any }) {
    if (action.type === 'RESET_FIELDS') return initialState;
    if (actionTypes.includes(action.type)) {
      return { ...state, [action.type.toLowerCase().replace('set_', '')]: action.payload };
    }
    return state;
  }

  const [state, dispatch] = useReducer(reducer, initialState);

  const resetFields = () => {
    dispatch({ type: 'RESET_FIELDS' });
  };

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
            {state.recapvideo ? <Video title="Recap" src={state.recapvideo} /> : null}
            <Text fw="bold">Recap Video Youtube URL:</Text>
            <TextInput
              value={state.recapvideo}
              onChange={(event) =>
                dispatch({ type: 'SET_RECAPVIDEO', payload: event.currentTarget.value })
              }
            />
          </Stack>

          <Stack gap="0">
            {state.promovideo ? <Video title="Promo" src={state.promovideo} /> : null}
            <Text fw="bold">Promo Video Youtube URL:</Text>
            <TextInput
              value={state.promovideo}
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
            defaultValue={state.date}
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
          <Button color="green">Save</Button>
          <Button onClick={() => resetFields()}>Reset</Button>
          <Button color="red" onClick={() => setEditEvent(false)}>
            Cancel
          </Button>
        </Stack>
      </Group>
    </div>
  );
}
