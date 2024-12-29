import { IconCirclePlus, IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Group, Title } from '@mantine/core';
import { IPartiesSection } from '@/types/types';
import { PartyCard } from '../Cards/PartyCard';
import { useEventContext } from '../Providers/EventProvider';

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function PartiesSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData, deleteSection, addCard } = useEventContext();

  const currentSection = eventData.sections[sectionIndex] as IPartiesSection;

  return (
    <Card m="md" withBorder>
      <Group justify="space-between">
        <CloseButton
          onClick={() => deleteSection(sectionIndex)}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
      </Group>
      <Title component={Center} order={3}>
        Parties
      </Title>
      <Group mt="sm" p="0" justify="center" gap="lg">
        <Button onClick={() => addCard(sectionIndex)} variant="outline" h="375" w="460">
          <Group align="center" justify="space-between">
            <IconCirclePlus size={100} />
            <Title order={4}>Add Party</Title>
          </Group>
        </Button>

        {currentSection.partyCards.map((partyCard, index) => {
          return <PartyCard key={index} cardIndex={index} sectionIndex={sectionIndex} />;
        })}
      </Group>
    </Card>
  );
}
