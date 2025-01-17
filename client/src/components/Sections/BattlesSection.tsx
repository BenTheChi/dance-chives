import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Button, Card, Center, CloseButton, Group, Stack, Tabs, Text, Title } from '@mantine/core';
import { DELETE_BATTLE_SECTION, UPDATE_BATTLE_SECTION } from '@/gql/returnQueries';
import { createListOfRoles } from '@/gql/utilities';
import { IBattlesSection, UserBasicInfo } from '@/types/types';
import { Bracket } from '../Bracket';
import { MultiTextField } from '../Display/MultiTextField';
import { useEventContext } from '../Providers/EventProvider';
import { EditBattlesSection } from './EditBattlesSection';

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function BattlesSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData, setEventData, deleteSection, updateSection } = useEventContext();
  const currentSection = eventData.sections[sectionIndex] as IBattlesSection;
  const [activeTab, setActiveTab] = useState<string | null>(
    currentSection.brackets.length > 0 ? currentSection.brackets[0].type.toLowerCase() : null
  );

  const [deleteBattlesSection, deleteResults] = useMutation(DELETE_BATTLE_SECTION);
  const [updateBattleSection, updateResults] = useMutation(UPDATE_BATTLE_SECTION);

  const updateEvent = (updatedValues: UserBasicInfo[], role: string) => {
    const changes = {
      [role]: {
        disconnect: [{ where: {} }],
        connect: createListOfRoles(updatedValues),
      },
    };

    updateBattleSection({
      variables: {
        where: {
          uuid: currentSection.uuid,
        },
        update: changes,
      },
    });
  };

  useEffect(() => {
    if (!updateResults.loading && updateResults.data) {
      console.log('SUCCESSFUL UPDATE');
      console.log(updateResults.data);

      let updatedSection = { ...currentSection };
      updatedSection.judges = updateResults.data.updateSections.sections[0].judges;
      updateSection(sectionIndex, updatedSection);
    }
  }, [updateResults.loading, updateResults.data]);

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
    return (
      <EditBattlesSection
        sectionIndex={sectionIndex}
        setActiveTab={setActiveTab}
      ></EditBattlesSection>
    );
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
            <MultiTextField
              values={currentSection.judges}
              updateEvent={updateEvent}
              title="Judges"
            />
          )}

          {currentSection.styles && (
            <Group gap="6px">
              <Text fw="700">Styles:</Text>
              {currentSection.styles.map((style) => (
                <Link to="/education/#" key={style}>
                  {style}
                </Link>
              ))}
            </Group>
          )}
        </Stack>
      </Center>

      {currentSection.brackets.length > 0 && (
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
      )}
    </Card>
  );
}
