import { useState } from 'react';
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
  //   const [image, setImage] = useState(eventData.images[0]);
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState(new Date(eventData.date * 1000));
  const [city, setCity] = useState(eventData.city);
  const [cost, setCost] = useState(eventData.cost);
  const [prizes, setPrizes] = useState(eventData.prizes);
  const [description, setDescription] = useState(eventData.description);
  const [address, setAddress] = useState(eventData.address);
  const [promoVideo, setpromoVideo] = useState(eventData.promoVideo);
  const [recapVideo, setrecapVideo] = useState(eventData.recapVideo);

  const [organizers, setOrganizers] = useState(eventData.organizers);
  const [mcs, setMcs] = useState(eventData.mcs);
  const [djs, setDjs] = useState(eventData.djs);
  const [videographers, setVideographers] = useState(eventData.videographers);
  const [photographers, setPhotographers] = useState(eventData.photographers);
  const [sponsors, setSponsors] = useState(eventData.sponsors);
  const [styles, setStyles] = useState(eventData.styles);

  const resetFields = () => {
    setDate(new Date(eventData.date * 1000));
    setCity(eventData.city);
    setCost(eventData.cost);
    setPrizes(eventData.prizes);
    setDescription(eventData.description);
    setAddress(eventData.address);
    setpromoVideo(eventData.promoVideo);
    setrecapVideo(eventData.recapVideo);

    setOrganizers(eventData.organizers);
    setMcs(eventData.mcs);
    setDjs(eventData.djs);
    setVideographers(eventData.videographers);
    setPhotographers(eventData.photographers);
    setSponsors(eventData.sponsors);
    setStyles(eventData.styles);
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
              src={'/src/images/' + eventData.images[0]}
              alt={`${eventData.title} Poster`}
              height={300}
              w="auto"
            />
          )}

          <FileButton onChange={setFile} accept="image/png,image/jpeg">
            {(props) => <Button {...props}>Upload image</Button>}
          </FileButton>
        </Stack>

        <Stack>
          <Stack gap="0">
            {recapVideo ? <Video title="Recap" src={recapVideo} /> : null}
            <Text fw="bold">Recap Video Youtube URL:</Text>
            <TextInput
              value={recapVideo}
              onChange={(event) => setrecapVideo(event.currentTarget.value)}
            />
          </Stack>

          <Stack gap="0">
            {promoVideo ? <Video title="Promo" src={promoVideo} /> : null}
            <Text fw="bold">Promo Video Youtube URL:</Text>
            <TextInput
              value={promoVideo}
              onChange={(event) => setpromoVideo(event.currentTarget.value)}
            />
          </Stack>
        </Stack>
        <Stack gap="1" align="flex-start">
          <Text fw="bold">Date & Time:</Text>
          <DateTimePicker
            pb="sm"
            onChange={(newDate) => setDate(newDate || new Date())}
            defaultValue={date}
            clearable
          />

          <EditField title="City" value={city} onChange={setCity} />
          <EditField title="Cost" value={cost} onChange={setCost} />
          <EditField title="Prizes" value={prizes} onChange={setPrizes} />
          <EditField title="Address" value={address} onChange={setAddress} />
          <EditField title="Description" value={description} onChange={setDescription} />
        </Stack>
        <Stack gap="0">
          <Text fw="700">Organizer:</Text>
          <MultiSelectCreatable notExists={notExists} value={organizers} onChange={setOrganizers} />

          <Text fw="700">MC:</Text>
          <MultiSelectCreatable notExists={notExists} value={mcs} onChange={setMcs} />

          <Text fw="700">DJ:</Text>
          <MultiSelectCreatable notExists={notExists} value={djs} onChange={setDjs} />

          <Text fw="700">Videographer:</Text>
          <MultiSelectCreatable
            notExists={notExists}
            value={videographers}
            onChange={setVideographers}
          />

          <Text fw="700">Photographer:</Text>
          <MultiSelectCreatable
            notExists={notExists}
            value={photographers}
            onChange={setPhotographers}
          />

          <Text fw="700">Sponsor:</Text>
          <MultiSelectCreatable notExists={notExists} value={sponsors} onChange={setSponsors} />

          <Text fw="700">Styles:</Text>
          <MultiSelectCreatable notExists={allStyles} value={styles} onChange={setStyles} />
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
