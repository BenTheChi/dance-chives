import { Card, Spoiler, Stack, Text, Title } from '@mantine/core';
import { IBattlesSection } from '../../types/types';
import { MultiTextField } from '../Display/MultiTextField';
import { useEventContext } from '../Providers/EventProvider';
import { Video } from '../Video';

export function BattleCard({
  sectionIndex,
  bracketIndex,
  cardIndex,
}: {
  sectionIndex: number;
  bracketIndex: number;
  cardIndex: number;
}) {
  const { eventData } = useEventContext() as { eventData: { sections: IBattlesSection[] } };

  const card = (eventData.sections[sectionIndex] as IBattlesSection).brackets[bracketIndex]
    .battleCards[cardIndex];

  return (
    <Card withBorder radius="md" shadow="sm" h="100%" w="460">
      <Title order={4}>{card.title}</Title>
      <Video title={card.title} src={card.src} />
      <Stack>
        {card.dancers?.length > 0 && <MultiTextField title="Dancers" values={card.dancers} />}
        <Spoiler maxHeight={1} w="460" showLabel="See Winners" hideLabel="Hide">
          {/* {card.teams.map((team, index) => {
            return (
              <Stack gap="0">
                <Text fw="bolder">
                  {team.name} {team.winner && '(W)'}
                </Text>
                <MultiTextField title="--Members" values={team.members} />
              </Stack>
            );
          })} */}
        </Spoiler>
      </Stack>
    </Card>
  );
}
