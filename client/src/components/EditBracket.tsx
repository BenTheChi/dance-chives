import { useEffect, useState } from 'react';
import { IconCirclePlus, IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, CloseButton, Group, Select, Stack, Title } from '@mantine/core';
import { IBracket } from '@/types/types';
import { BattleCard } from './Cards/BattleCard';
import { EditBattleCard } from './Cards/EditBattleCard';

export function EditBracket({
  sectionIndex,
  bracketIndex,
  brackets,
  setBrackets,
}: {
  sectionIndex: number;
  bracketIndex: number;
  brackets: IBracket[];
  setBrackets: (value: IBracket[]) => void;
}) {
  // const [editSection, setEditSection] = useState(false);
  const bracket = brackets[bracketIndex];

  // const addCard = () => {
  //   const updatedBrackets = [...brackets];
  //   updatedBrackets[bracketIndex] = {
  //     ...bracket,
  //     battleCards: [...bracket.battleCards, { title: '', src: '', winners: [], dancers: [] }],
  //   };

  //   setBrackets(updatedBrackets);
  // };

  const deleteBracket = () => {
    const updatedBrackets = [...brackets];
    updatedBrackets.splice(bracketIndex, 1);
    setBrackets(updatedBrackets);
  };

  useEffect(() => {
    // Re-render the component when brackets change
  }, [brackets]);

  return (
    <Card withBorder>
      <Group justify="space-between">
        <CloseButton
          onClick={deleteBracket}
          mb="sm"
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        {/* <Group justify="right">
          <Button onClick={() => setEditSection(true)}>Edit</Button>
        </Group> */}
        <span>{brackets[bracketIndex]?.battleCards?.length || 0}: BattleCard(s) </span>
        <Select
          w="80%"
          size="lg"
          searchable
          data={['Prelims', 'Top 32', 'Top 16', 'Top 8', 'Top 4', 'Finals', '7 to Smoke']}
          value={bracket.type}
          onChange={(value) => {
            const updatedBrackets = [...brackets];
            if (value) {
              updatedBrackets[bracketIndex] = { ...updatedBrackets[bracketIndex], type: value };
              setBrackets(updatedBrackets);
            }
            setBrackets(updatedBrackets);
          }}
        />
      </Group>
      {/* <Group p="md" align="flex-start">
        {bracket.battleCards.map((battleCard, index) => (
          <BattleCard
            key={index}
            sectionIndex={sectionIndex}
            bracketIndex={bracketIndex}
            cardIndex={index}
          />
        ))}
        <Button onClick={addCard} variant="outline" h="375" w="460">
          <Group align="center" justify="space-between">
            <IconCirclePlus size={100} />
            <Title order={4}>Add Battle</Title>
          </Group>
        </Button>
      </Group> */}
    </Card>
  );
}
