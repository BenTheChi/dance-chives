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
        <Grid justify="flex-start" align="stretch" p="sm" gutter="md">
          {/* Battle cards */}
          {currentBracket.battleCards.map((battleCard, index) => (
            <Grid.Col
              key={`battle-${index}`}
              span={{ base: 12, sm: 6, md: 4 }}
              order={currentBracket.battleCards.length - index}
            >
              <BattleCard
                sectionIndex={sectionIndex}
                bracketIndex={bracketIndex}
                cardIndex={index}
              />
            </Grid.Col>
          ))}
          {/* Add Battle button */}
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }} order={-1}>
            <Button
              onClick={() => addCard(sectionIndex, bracketIndex)}
              variant="outline"
              h="100%"
              w="100%"
              styles={{
                root: {
                  minHeight: '375px',
                },
              }}
            >
              <Group align="center" justify="center">
                <IconCirclePlus size={100} />
                <Title order={4}>Add Battle</Title>
              </Group>
            </Button>
          </Grid.Col>
        </Grid>
      </ScrollArea>
    </Tabs.Panel>
  );
}
