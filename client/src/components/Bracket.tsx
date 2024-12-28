import { useEffect, useState } from 'react';
import { IconCirclePlus } from '@tabler/icons-react';
import { Accordion, Button, Group, Title } from '@mantine/core';
import { IBattleCard, IBattlesSection } from '@/types/types';
import { BattleCard } from './Cards/BattleCard';
import { EditBattleCard } from './Cards/EditBattleCard';
import { useEventContext } from './Providers/EventProvider';

export function Bracket({
  sectionIndex,
  bracketIndex,
}: {
  sectionIndex: number;
  bracketIndex: number;
}) {
  const { eventData, updateBracket } = useEventContext();
  const currentBracket = (eventData.sections[sectionIndex] as IBattlesSection).brackets[
    bracketIndex
  ];

  // const bracket = brackets[bracketIndex];

  const addCard = () => {
    let updatedBracket = { ...currentBracket };
    updatedBracket.battleCards.unshift({
      title: '',
      src: '',
      winners: [],
      dancers: [],
      isEditable: true,
    });
    updateBracket(sectionIndex, bracketIndex, updatedBracket);
    // setNewCards([...newCards, { title: '', src: '', winners: [], dancers: [] }]);
  };

  // useEffect(() => {
  //   console.log(currentBracket);
  // }, [currentBracket]);

  // console.log(currentBracket.battleCards);

  return (
    <Accordion.Item key={bracketIndex} value={currentBracket.type}>
      <Accordion.Control>{currentBracket.type}</Accordion.Control>
      <Accordion.Panel>
        <Button onClick={addCard} variant="outline" h="375" w="460">
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
