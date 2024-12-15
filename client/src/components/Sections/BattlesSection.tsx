import { IconSquareXFilled } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import {
  Accordion,
  Button,
  Card,
  Center,
  CloseButton,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Bracket } from '../Bracket';
import { useEventContext } from '../Providers/EventProvider';

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function BattlesSection({
  sectionIndex,
  deleteSection,
  setEditSection,
}: {
  sectionIndex: number;
  deleteSection: (sectionIndex: number) => void;
  setEditSection: (value: boolean) => void;
}) {
  const handleDeleteSection = () => {
    setEditSection(false);
    deleteSection(sectionIndex);
  };

  const { eventData } = useEventContext();
  const currentSection = eventData.sections[sectionIndex];

  return (
    <Card m="md" withBorder>
      <Group justify="space-between">
        <CloseButton
          onClick={handleDeleteSection}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Group justify="right">
          <Button onClick={() => setEditSection(true)}>Edit</Button>
        </Group>
      </Group>

      <Title component={Center} order={3}>
        {eventData.sections[sectionIndex].format}
      </Title>

      <Center mt="md">
        <Stack>
          {currentSection.judges && (
            <Group gap="6px">
              <Text fw="700">Judges:</Text>
              {currentSection.judges.map((judge) => (
                <Link to="/user/#" key={judge}>
                  {judge}
                </Link>
              ))}
            </Group>
          )}

          {currentSection.styles && (
            <Group gap="6px">
              <Text fw="700">Styles:</Text>
              {currentSection.styles.map((style) => (
                <Link to="/education/#">{style}</Link>
              ))}
            </Group>
          )}
        </Stack>
      </Center>

      <Group mt="sm" p="0" justify="center" gap="lg" ml="5%" mr="5%">
        <Accordion radius="xs" variant="contained" w="100%">
          {currentSection.brackets &&
            currentSection.brackets.map((bracket, index) => (
              <Bracket key={index} sectionIndex={sectionIndex} bracketIndex={index}></Bracket>
            ))}
        </Accordion>
      </Group>
    </Card>
  );
}
