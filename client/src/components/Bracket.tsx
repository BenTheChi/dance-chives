import { IconCirclePlus } from '@tabler/icons-react';
import { Accordion, Button, Flex, Grid, Group, ScrollArea, Tabs, Title } from '@mantine/core';
import { IBattlesSection } from '@/types/types';
import { BattleCard } from './Cards/BattleCard';
import { useEventContext } from './Providers/EventProvider';

export function Bracket({
  sectionIndex,
  bracketIndex,
}: {
  sectionIndex: number;
  bracketIndex: number;
}) {
  const { eventData, addCard } = useEventContext();
  const currentBracket = (eventData.sections[sectionIndex] as IBattlesSection).brackets[
    bracketIndex
  ];

  return (
    <Tabs.Panel key={bracketIndex} value={currentBracket.type.toLowerCase()}>
      <ScrollArea h={450}>
        <Grid justify="flex-start" align="stretch" p="sm">
          <Grid.Col span={4}>
            <Button
              onClick={() => addCard(sectionIndex, bracketIndex)}
              variant="outline"
              h="375"
              w="460"
            >
              <Group align="center" justify="space-between">
                <IconCirclePlus size={100} />
                <Title order={4}>Add Battle</Title>
              </Group>
            </Button>
          </Grid.Col>
          {currentBracket.battleCards.map((battleCard, index) => {
            return (
              <Grid.Col span={4}>
                <BattleCard
                  key={index}
                  sectionIndex={sectionIndex}
                  bracketIndex={bracketIndex}
                  cardIndex={index}
                />
              </Grid.Col>
            );
          })}
        </Grid>
      </ScrollArea>
    </Tabs.Panel>
  );
}
