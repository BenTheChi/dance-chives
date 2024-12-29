import { useEffect } from 'react';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Card, CloseButton, Group, Select } from '@mantine/core';
import { IBracket } from '@/types/types';

export function EditBracket({
  bracketIndex,
  brackets,
  setBrackets,
}: {
  bracketIndex: number;
  brackets: IBracket[];
  setBrackets: (value: IBracket[]) => void;
}) {
  const bracket = brackets[bracketIndex];

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
    </Card>
  );
}
