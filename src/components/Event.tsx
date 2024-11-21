import { Link } from 'react-router-dom';
import { Button, Group, Image, Stack, Text, Title } from '@mantine/core';
import { PromoRecapCard } from './Cards/PromoRecapCard';
import { MultiTextField } from './Display/MultiTextField';
import { TextField } from './Display/TextField';
import { useEventContext } from './Providers/EventProvider';
import { BattlesSection } from './Sections/BattlesSection';
import { PartiesSection } from './Sections/PartiesSection';
import { PerformancesSection } from './Sections/PerformancesSection';
import { WorkshopsSection } from './Sections/WorkshopsSection';

export function Event() {
  const { eventData } = useEventContext();

  return (
    <div>
      {/* Use unstyled TextInput for edits */}
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
          <TextField title="Date" value={new Date(eventData.date * 1000).toLocaleDateString()} />

          <TextField title="City" value={eventData.city} />

          <TextField title="Cost" value={eventData.cost} />

          <TextField title="Prizes" value={eventData.prizes} />

          <TextField title="Description" value={eventData.description} />

          <TextField title="Address" value={eventData.address} />

          {eventData.organizersExists?.length > 0 || eventData.organizersNotExists?.length > 0 ? (
            <Group gap="6px">
              <Text fw="700">Organizer:</Text>
              {eventData.organizersExists?.map((organizer, index) => (
                <Link key={index} to="/user/#">
                  {organizer}
                </Link>
              ))}
              {eventData.organizersNotExists?.map((organizer, index) => (
                <Text key={index}>{organizer}</Text>
              ))}
            </Group>
          ) : null}

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

          <Group mt="md">
            <Button>Edit</Button>
            <Button>Delete</Button>
          </Group>
        </Stack>
        {eventData.recapVideo && <PromoRecapCard title="Recap" src={eventData.recapVideo} />}
        {eventData.promoVideo && <PromoRecapCard title="Promo" src={eventData.promoVideo} />}
      </Group>
      {eventData.sections.map(({ type }, index) => {
        switch (type) {
          case 'battles':
            return <BattlesSection key={index} sectionIndex={index} />;
          case 'workshops':
            return <WorkshopsSection key={index} sectionIndex={index} />;
          case 'parties':
            return <PartiesSection key={index} sectionIndex={index} />;
          case 'performances':
            return <PerformancesSection key={index} sectionIndex={index} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
