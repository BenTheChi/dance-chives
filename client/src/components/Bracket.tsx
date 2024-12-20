import { Accordion, Group } from '@mantine/core';
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
  const { eventData } = useEventContext();
  const currentBracket = (eventData.sections[sectionIndex] as IBattlesSection).brackets[
    bracketIndex
  ];

  return (
    <Accordion.Item key={bracketIndex} value={currentBracket.type}>
      <Accordion.Control>{currentBracket.type}</Accordion.Control>
      <Accordion.Panel>
        <Group>
          {currentBracket.battleCards.map((battleCard, index) => (
            <BattleCard
              key={index}
              sectionIndex={sectionIndex}
              bracketIndex={bracketIndex}
              cardIndex={index}
            />
          ))}
        </Group>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
