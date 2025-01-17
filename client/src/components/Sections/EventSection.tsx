import { useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { Group, Image, Stack, Title } from '@mantine/core';
import { UPDATE_EVENTS } from '@/gql/returnQueries';
import { createListOfRoles } from '@/gql/utilities';
import { UserBasicInfo } from '../../types/types';
import { PromoRecapCard } from '../Cards/PromoRecapCard';
import { MultiTextField } from '../Display/MultiTextField';
import { MultiTextStyleField } from '../Display/MultiTextStyleField';
import { TextField } from '../Display/TextField';
import { useEventContext } from '../Providers/EventProvider';

export function EventSection() {
  const { eventData, updateEventData } = useEventContext();

  const [updateEvents, { data, loading, error }] = useMutation(UPDATE_EVENTS);

  // function convertUpdateGQL(event: any) {
  //   event.city = event.inCity.name;
  //   event.styles?.length && (event.styles = event.styles.map((style: any) => style.name));

  //   return event;
  // }

  const updateEvent = (updatedValues: UserBasicInfo[], role: string) => {
    const changes = {
      [role]: {
        disconnect: [{ where: {} }],
        connect: createListOfRoles(updatedValues),
      },
    };

    // Update the event with the processed changes
    updateEvents({
      variables: {
        where: {
          uuid: eventData.uuid,
        },
        update: changes,
      },
    });
  };

  useEffect(() => {
    if (!loading && data) {
      let newData = data.updateEvents.events[0];
      newData.city = newData.inCity.name;
      newData.styles?.length && (newData.styles = newData.styles.map((style: any) => style.name));
      updateEventData(newData);
    }
  }, [loading, data]);

  return (
    <div>
      <Title order={2} ml="md">
        {eventData.title}
      </Title>
      <Group align="center" m="md">
        <Image src={eventData.images[0]} alt={`${eventData.title} Poster`} height={500} w="auto" />
        <Stack gap="1" align="flex-start" w="600px">
          <TextField title="Date & Time" value={new Date(eventData.date * 1000).toLocaleString()} />

          <TextField title="City" value={eventData.city} />

          <TextField title="Cost" value={eventData.cost} />

          <TextField title="Prizes" value={eventData.prizes} />

          <TextField title="Description" value={eventData.description} />

          <TextField title="Address" value={eventData.address} />

          <MultiTextField
            title="Organizers"
            values={eventData.organizers}
            updateEvent={updateEvent}
          />

          <MultiTextField title="MCs" values={eventData.mcs} updateEvent={updateEvent} />

          <MultiTextField title="DJs" values={eventData.djs} updateEvent={updateEvent} />

          <MultiTextField
            title="Videographers"
            values={eventData.videographers}
            updateEvent={updateEvent}
          />

          <MultiTextField
            title="Photographers"
            values={eventData.photographers}
            updateEvent={updateEvent}
          />

          <MultiTextStyleField values={eventData.styles} />
        </Stack>
        {eventData.recapVideo && <PromoRecapCard title="Recap" src={eventData.recapVideo} />}
        {eventData.promoVideo && <PromoRecapCard title="Promo" src={eventData.promoVideo} />}
      </Group>
    </div>
  );
}
