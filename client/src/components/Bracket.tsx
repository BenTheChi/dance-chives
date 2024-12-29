import { IconCirclePlus } from '@tabler/icons-react';
import { Accordion, Button, Group, Title } from '@mantine/core';
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
    <Accordion.Item key={bracketIndex} value={currentBracket.type}>
      <Accordion.Control>{currentBracket.type}</Accordion.Control>
      <Accordion.Panel>
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
        <Group>
          {currentBracket.battleCards.map((battleCard, index) => {
            return (
              <BattleCard
                key={index}
                sectionIndex={sectionIndex}
                bracketIndex={bracketIndex}
                cardIndex={index}
              />
            );
          })}
        </Group>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
