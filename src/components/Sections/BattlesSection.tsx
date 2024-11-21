import { Link } from 'react-router-dom';
import { Accordion, Card, Center, Group, Text, Title } from '@mantine/core';
import { Bracket } from '../Bracket';
import { useEventContext } from '../Providers/EventProvider';

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function BattlesSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData } = useEventContext();
  const currentSection = eventData.sections[sectionIndex];

  return (
    <Card m="md" withBorder>
      <Title component={Center} order={3}>
        {eventData.sections[sectionIndex].format}
      </Title>

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

      <Group mt="sm" p="0" justify="center" gap="lg">
        <Accordion radius="xs" variant="contained">
          {currentSection.brackets &&
            currentSection.brackets.map((bracket, index) => (
              <Bracket key={index} sectionIndex={sectionIndex} bracketIndex={index}></Bracket>
            ))}
        </Accordion>
      </Group>
    </Card>
  );
}
