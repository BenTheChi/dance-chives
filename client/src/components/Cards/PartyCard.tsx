import { useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Image, Stack, Title } from '@mantine/core';
// import { DELETE_PARTY_CARD, UPDATE_PARTY_CARD } from '@/gql/returnQueries';
import { createListOfRoles } from '@/gql/utilities';
import { IPartiesSection, UserBasicInfo } from '@/types/types';
import { MultiTextField } from '../Display/MultiTextField';
import { TextField } from '../Display/TextField';
import { useEventContext } from '../Providers/EventProvider';
import { EditPartyCard } from './EditPartyCard';

export function PartyCard({
  cardIndex,
  sectionIndex,
}: {
  cardIndex: number;
  sectionIndex: number;
}) {
  const { eventData, deleteCard, updateCardEditable, updateSection } = useEventContext();
  const card = (eventData.sections[sectionIndex] as IPartiesSection).partyCards[cardIndex];

  // const [deletePartyCard, deleteResults] = useMutation(DELETE_PARTY_CARD);
  // const [updatePartyCard, updateResults] = useMutation(UPDATE_PARTY_CARD);

  // const updateEvent = (updatedValues: UserBasicInfo[], role: string) => {
  //   const changes = {
  //     [role]: {
  //       disconnect: [{ where: {} }],
  //       connect: createListOfRoles(updatedValues),
  //     },
  //   };

  //   updatePartyCard({
  //     variables: {
  //       where: {
  //         uuid: card.uuid,
  //       },
  //       update: changes,
  //     },
  //   });
  // };

  // useEffect(() => {
  //   if (!updateResults.loading && updateResults.data) {
  //     console.log('SUCCESSFUL UPDATE');
  //     console.log(updateResults.data);

  //     let updatedSection = { ...eventData.sections[sectionIndex] } as IPartiesSection;
  //     const updatedCard = updateResults.data.updatePartyCards.partyCards[0];
  //     updatedSection.partyCards[cardIndex] = {
  //       ...card,
  //       dj: updatedCard.dj,
  //     };
  //     updateSection(sectionIndex, updatedSection);
  //   }
  // }, [updateResults.loading, updateResults.data]);

  if (card.isEditable) {
    return <EditPartyCard sectionIndex={sectionIndex} cardIndex={cardIndex} />;
  }
  return (
    <Card withBorder radius="md" shadow="sm" h="100%">
      <Group justify="space-between">
        <CloseButton
          onClick={() => deleteCard(sectionIndex, cardIndex)}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Group justify="right">
          <Button onClick={() => updateCardEditable(sectionIndex, cardIndex, true)}>Edit</Button>
        </Group>
      </Group>
      <Group align="flex-start">
        {card.image && (
          <Image src={card.image} alt={`${card.title} Poster`} height={300} w="auto" />
        )}
        <Stack gap="0">
          <Title order={4}>{card.title}</Title>
          <TextField title="Date & Time" value={new Date(card.date * 1000).toLocaleString()} />
          <TextField title="Address" value={card.address} />
          <TextField title="Cost" value={card.cost} />
          {/* {card.dj?.length > 0 && (
            <MultiTextField title="DJs" values={card.dj} updateEvent={updateEvent} />
          )} */}
        </Stack>
      </Group>
    </Card>
  );
}
