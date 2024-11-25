import { Button, Group, Image, Stack, Text, Title } from '@mantine/core';
import { PromoRecapCard } from '../Cards/PromoRecapCard';
import { MultiTextField } from '../Display/MultiTextField';
import { TextField } from '../Display/TextField';
import { useEventContext } from '../Providers/EventProvider';

export function EventSection() {
  const { eventData } = useEventContext();

  return (
    <div>
      <Title order={2} ml="md">
        {eventData.title}
      </Title>
      <Group align="center" m="md">
        <Image
          src={'/src/images/' + eventData.images[0]}
          alt={`${eventData.title} Poster`}
          height={500}
          w="auto"
        />
        <Stack gap="1" align="flex-start" w="600px">
          <TextField title="Date & Time" value={new Date(eventData.date * 1000).toLocaleString()} />

          <TextField title="City" value={eventData.city} />

          <TextField title="Cost" value={eventData.cost} />

          <TextField title="Prizes" value={eventData.prizes} />

          <TextField title="Description" value={eventData.description} />

          <TextField title="Address" value={eventData.address} />

          {eventData.organizers?.length > 0 && (
            <MultiTextField title="Organizer" values={eventData.organizers} />
          )}

          {eventData.mcs?.length > 0 && <MultiTextField title="MC" values={eventData.mcs} />}

          {eventData.djs?.length > 0 && <MultiTextField title="DJ" values={eventData.djs} />}

          {eventData.styles?.length > 0 && (
            <MultiTextField title="Styles" values={eventData.styles} />
          )}

          {eventData.videographers?.length > 0 && (
            <MultiTextField title="Videographer" values={eventData.videographers} />
          )}

          {eventData.photographers?.length > 0 && (
            <MultiTextField title="Photographer" values={eventData.photographers} />
          )}

          {eventData.sponsors?.length > 0 && (
            <MultiTextField title="Sponsor" values={eventData.sponsors} />
          )}
        </Stack>
        {eventData.recapVideo && <PromoRecapCard title="Recap" src={eventData.recapVideo} />}
        {eventData.promoVideo && <PromoRecapCard title="Promo" src={eventData.promoVideo} />}
      </Group>
    </div>
  );
}
