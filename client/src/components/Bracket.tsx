import { Accordion, Group } from '@mantine/core';
import { BattleCard } from './Cards/BattleCard';
import { useEventContext } from './Providers/EventProvider';

interface BattleCard {
  title: string;
  src: string;
  teams:
    | {
        name: string;
        members: string[];
        winner: boolean;
      }[]
    | [];
  dancers: string[];
}

interface Bracket {
  type: string;
  battleCards: BattleCard[];
}

interface BattlesSection {
  type: string;
  format: string;
  styles: string[];
  judges: string[];
  brackets: Bracket[];
}

export function Bracket({
  sectionIndex,
  bracketIndex,
}: {
  sectionIndex: number;
  bracketIndex: number;
}) {
  const { eventData } = useEventContext();
  const currentBracket = (eventData.sections[sectionIndex] as BattlesSection).brackets[
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
