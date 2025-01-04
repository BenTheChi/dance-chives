import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Button, Card, Center, CloseButton, Group, Stack, Tabs, Text, Title } from '@mantine/core';
import { DELETE_BATTLE_SECTION } from '@/gql/returnQueries';
import { IBattlesSection } from '@/types/types';
import { Bracket } from '../Bracket';
import { useEventContext } from '../Providers/EventProvider';
import { EditBattlesSection } from './EditBattlesSection';

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function BattlesSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData, setEventData, deleteSection } = useEventContext();
  const currentSection = eventData.sections[sectionIndex] as IBattlesSection;
  const [activeTab, setActiveTab] = useState<string | null>(
    currentSection.brackets.length > 0 ? currentSection.brackets[0].type.toLowerCase() : 'add'
  );

  const [deleteBattlesSection, deleteResults] = useMutation(DELETE_BATTLE_SECTION);

  const handleDelete = (sectionIndex: number) => {
    if (eventData.sections[sectionIndex].uuid === '') {
      deleteSection(sectionIndex);
    } else {
      deleteBattlesSection({
        variables: {
          where: {
            uuid: eventData.sections[sectionIndex].uuid,
          },
        },
      });
    }
  };

  useEffect(() => {
    if (!deleteResults.loading && deleteResults.data) {
      console.log('SUCCESSFUL DELETE');
      console.log(deleteResults.data);
      deleteSection(sectionIndex);
    }
  }, [deleteResults.loading, deleteResults.data]);

  if (currentSection.isEditable) {
    return <EditBattlesSection sectionIndex={sectionIndex}></EditBattlesSection>;
  }
  return (
    <Card m="md" w="95%" withBorder>
      <Group justify="space-between">
        <CloseButton
          onClick={() => handleDelete(sectionIndex)}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Group justify="right">
          <Button
            onClick={() => {
              let updatedEvent = { ...eventData };
              (updatedEvent.sections[sectionIndex] as IBattlesSection).isEditable = true;
              setEventData(updatedEvent);
            }}
          >
            Edit
          </Button>
        </Group>
      </Group>

      <Title component={Center} order={3}>
        {currentSection.format as IBattlesSection['format']}
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

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          {currentSection.brackets &&
            currentSection.brackets.map((bracket, index) => (
              <Tabs.Tab key={index} value={bracket.type.toLowerCase()}>
                {bracket.type}
              </Tabs.Tab>
            ))}
        </Tabs.List>
        {currentSection.brackets &&
          currentSection.brackets.map((bracket, index) => (
            <Bracket key={index} sectionIndex={sectionIndex} bracketIndex={index}></Bracket>
          ))}
      </Tabs>
    </Card>
  );
}
