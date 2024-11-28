import { useEffect, useState } from 'react';
import { IconSquareXFilled } from '@tabler/icons-react';
import {
  Button,
  Card,
  Center,
  CloseButton,
  Group,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IBracket } from '@/types/types';
import { EditBracket } from '../EditBracket';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
import { useEventContext } from '../Providers/EventProvider';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];
const allStyles = ['Breaking', 'Popping', 'Locking', 'Hip Hop', 'House', 'Waacking', 'Vogue'];

export function EditBattlesSection({
  sectionIndex,
  setEditSection,
  deleteSection,
}: {
  sectionIndex: number;
  setEditSection: (value: boolean) => void;
  deleteSection: (sectionIndex: number) => void;
}) {
  const { eventData } = useEventContext();

  //Create a copy of the value to avoid direct context changes
  const currentSection = JSON.parse(JSON.stringify(eventData.sections[sectionIndex]));

  const [title, setTitle] = useState(currentSection.format);
  const [judges, setJudges] = useState(currentSection.judges || []);
  const [styles, setStyles] = useState(currentSection.styles || []);
  const [brackets, setBrackets] = useState<IBracket[]>(currentSection.brackets || []);

  const [bracketName, setBracketName] = useState('Prelims');

  const resetFields = () => {
    setTitle(currentSection.format);
    setJudges(currentSection.judges || []);
    setStyles(currentSection.styles || []);
    setBrackets(currentSection.brackets || []);
  };

  const addBracket = () => {
    setBrackets([...brackets, { type: bracketName, battleCards: [] }]);
  };

  const handleDeleteSection = () => {
    setEditSection(false);
    deleteSection(sectionIndex);
  };

  useEffect(() => {
    // Re-render the component when brackets change
  }, [eventData]);

  return (
    <Card m="md" withBorder>
      <Group justify="space-between">
        <CloseButton
          onClick={handleDeleteSection}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Group>
          <Button color="green">Save</Button>
          <Button onClick={() => resetFields()}>Reset</Button>
          <Button color="red" onClick={() => setEditSection(false)}>
            Cancel
          </Button>
        </Group>
      </Group>
      <Center>
        <Stack component="center">
          <Title order={3}>{title}</Title>
          <Group gap="6px">
            <Text fw="700">Judges:</Text>
            <MultiSelectCreatable notExists={notExists} value={judges} onChange={setJudges} />
          </Group>
          <Group gap="6px">
            <Text fw="700">Styles:</Text>
            <MultiSelectCreatable notExists={allStyles} value={styles} onChange={setStyles} />
          </Group>
        </Stack>
      </Center>

      <Group mt="sm" p="0" justify="center" gap="lg">
        {brackets.map((bracket, index) => (
          <EditBracket
            key={index}
            sectionIndex={sectionIndex}
            bracketIndex={index}
            brackets={brackets}
            setBrackets={setBrackets}
          ></EditBracket>
        ))}
      </Group>
      <Center m="md">
        <Select
          size="md"
          searchable
          data={['Prelims', 'Top 32', 'Top 16', 'Top 8', 'Top 4', 'Finals', '7 to Smoke']}
          value={bracketName ? bracketName : null}
          onChange={(_value, option) => setBracketName(option.value)}
          mr="sm"
        />
        <Button onClick={() => addBracket()}>Add Bracket</Button>
      </Center>
    </Card>
  );
}
