import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Group, Select, Stack, Text } from '@mantine/core';
import {
  createConnectOrCreateListOfStyles,
  createCreateListOfBrackets,
  createDeleteListOfBrackets,
  createDeleteListOfRoles,
  createDeleteListOfStyles,
  createListOfRoles,
} from '@/gql/utilities';
import { IBattlesSection, IBracket, UserBasicInfo } from '@/types/types';
import { buildMutation, ObjectComparison } from '@/utilities/utility';
import {
  CREATE_BATTLE_SECTION,
  DELETE_BATTLE_SECTION,
  UPDATE_BATTLE_SECTION,
  UPDATE_BRACKET,
} from '../../gql/returnQueries';
import { EditBracket } from '../EditBracket';
import { EditField } from '../Inputs/EditField';
import { StringsMultiSelectCreatable } from '../Inputs/StringsMultiSelectCreatable';
import { UsersMultiSelect } from '../Inputs/UsersMultiSelect';
import { useEventContext } from '../Providers/EventProvider';

const allStyles = ['Breaking', 'Popping', 'Locking', 'Hip Hop', 'House', 'Waacking', 'Vogue'];

export function EditBattlesSection({
  sectionIndex,
  setActiveTab,
}: {
  sectionIndex: number;
  setActiveTab: (value: string) => void;
}) {
  const { eventData, deleteSection, updateSection, updateBattlesSectionEditable } =
    useEventContext();

  //Create a copy of the value to avoid direct context changes
  const currentSection = JSON.parse(JSON.stringify(eventData.sections[sectionIndex]));

  const [updateBattleSection, updateResults] = useMutation(UPDATE_BATTLE_SECTION);
  const [createBattlesSection, createResults] = useMutation(CREATE_BATTLE_SECTION);
  const [deleteBattlesSection, deleteResults] = useMutation(DELETE_BATTLE_SECTION);
  const [updateBracket, updateBracketResults] = useMutation(UPDATE_BRACKET);

  function buildBracketMutation(originalBrackets: IBracket[], updatedBrackets: IBracket[]) {
    const createBracketMap = (brackets: IBracket[]): { [key: string]: IBracket } =>
      brackets.reduce((acc, bracket) => ({ ...acc, [bracket.uuid]: bracket }), {});

    const originalMap = createBracketMap(originalBrackets);
    const updatedMap = createBracketMap(updatedBrackets);

    const toDeleteBrackets = originalBrackets
      .filter((bracket) => !updatedMap[bracket.uuid])
      .map((bracket) => bracket.uuid);

    const toCreateBrackets = updatedBrackets
      .filter((bracket) => !originalMap[bracket.uuid])
      .map(({ type, order, uuid }) => ({ type, order, uuid }));

    const toUpdateBrackets = updatedBrackets
      .filter(({ uuid, type, order }) => {
        const original = originalMap[uuid];
        return original && (original.type !== type || original.order !== order);
      })
      .map(({ uuid, type, order }) => ({ uuid, type, order }));

    return {
      toDeleteBrackets,
      toCreateBrackets,
      toUpdateBrackets,
    };
  }

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
    setBrackets([
      ...brackets,
      { uuid: crypto.randomUUID(), type: bracketName, battleCards: [], order: brackets.length },
    ]);
  };

  const handleSubmit = () => {
    const changes = ObjectComparison(eventData.sections[sectionIndex], {
      format: title,
      judges: judges,
      styles: styles,
      brackets: brackets,
    });

    //New Section
    if (!eventData.sections[sectionIndex].uuid) {
      //TODO Setup an alert here to check for validation

      let newSection = { ...eventData.sections[sectionIndex], ...changes } as IBattlesSection;

      newSection.brackets = newSection.brackets.map((bracket, index) => {
        return { ...bracket, order: index };
      });

      createBattlesSection({
        variables: {
          input: [
            {
              order: sectionIndex.toString(),
              uuid: crypto.randomUUID(),
              format: newSection.format,
              type: newSection.type,
              judges: {
                connect: createListOfRoles(newSection.judges),
              },
              styles: {
                connectOrCreate: createConnectOrCreateListOfStyles(newSection.styles),
              },
              brackets: {
                create: createCreateListOfBrackets(newSection.brackets),
              },
              partOfEvent: {
                connect: { where: { node: { uuid: eventData.uuid } } },
              },
            },
          ],
        },
      });
    } else {
      const originalBrackets = (eventData.sections[sectionIndex] as IBattlesSection).brackets;

      let bracketsMutation: {
        toCreateBrackets: { type: string; order: number; uuid: string }[];
        toUpdateBrackets: { uuid: string; type: string; order: number }[];
        toDeleteBrackets: string[];
      } = {
        toCreateBrackets: [],
        toUpdateBrackets: [],
        toDeleteBrackets: [],
      };

      if (changes.brackets) {
        const mutationResult = buildBracketMutation(
          originalBrackets,
          changes.brackets.map((bracket: IBracket, index: number) => {
            return { ...bracket, order: index };
          })
        );

        bracketsMutation.toCreateBrackets = mutationResult.toCreateBrackets;
        bracketsMutation.toUpdateBrackets = mutationResult.toUpdateBrackets;
        bracketsMutation.toDeleteBrackets = mutationResult.toDeleteBrackets;
      }

      // const judgesMutation = changes.judges
      //   ? buildMutation(
      //       (eventData.sections[sectionIndex] as IBattlesSection).judges || [],
      //       changes.judges || []
      //     )
      //   : { toCreate: [], toDelete: [] };

      const stylesMutation = changes.styles
        ? buildMutation(
            (eventData.sections[sectionIndex] as IBattlesSection).styles || [],
            changes.styles || []
          )
        : { toCreate: [], toDelete: [] };

      // judgesMutation = buildMutation(
      //   (eventData.sections[sectionIndex] as IBattlesSection).judges || [],
      //   changes.judges || []
      // );
      // stylesMutation = buildMutation(
      //   (eventData.sections[sectionIndex] as IBattlesSection).styles || [],
      //   changes.styles || []
      // );

      updateBattleSection({
        variables: {
          where: {
            uuid: eventData.sections[sectionIndex].uuid,
          },
          update: {
            format: title,
            brackets: {
              create: createCreateListOfBrackets(bracketsMutation.toCreateBrackets),
              delete: createDeleteListOfBrackets(bracketsMutation.toDeleteBrackets),
            },
            judges: {
              disconnect: [{ where: {} }],
              connect: createListOfRoles(judges),
            },
            styles: {
              connectOrCreate: createConnectOrCreateListOfStyles(stylesMutation.toCreate),
              delete: createDeleteListOfStyles(stylesMutation.toDelete),
            },
          },
        },
      });

      //Update each bracket in a separate query
      for (let index = 0; index < bracketsMutation.toUpdateBrackets.length; index++) {
        const bracket = bracketsMutation.toUpdateBrackets[index];
        updateBracket({
          variables: {
            where: {
              uuid: bracket.uuid,
            },
            update: {
              type: bracket.type,
              order: bracket.order.toString(),
            },
          },
        });
      }

      let newSection = eventData.sections[sectionIndex] as IBattlesSection;
      newSection.brackets = brackets;
      if (brackets.length > 0) {
        setActiveTab(brackets[0].type.toLowerCase());
      } else {
        setActiveTab('');
      }

      updateSection(sectionIndex, newSection);
    }
  };

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
    // Re-render the component when brackets change
  }, [eventData]);

  useEffect(() => {
    if (!deleteResults.loading && deleteResults.data) {
      console.log('SUCCESSFUL DELETE');
      console.log(deleteResults.data);
      deleteSection(sectionIndex);
    }
  }, [deleteResults.loading, deleteResults.data]);

  useEffect(() => {
    if (!updateResults.loading && updateResults.data) {
      console.log('SUCCESSFUL UPDATE');
      console.log(updateResults.data);

      let newSection = eventData.sections[sectionIndex] as IBattlesSection;
      newSection.isEditable = false;
      newSection.format = title;
      newSection.judges = judges;
      newSection.styles = styles;

      updateSection(sectionIndex, newSection);
    }
  }, [updateResults.loading, updateResults.data]);

  useEffect(() => {
    if (!createResults.loading && createResults.data) {
      console.log('SUCCESSFUL CREATE');
      console.log(createResults.data);

      let newSection = eventData.sections[sectionIndex] as IBattlesSection;
      newSection.brackets = brackets;
      newSection.isEditable = false;
      newSection.format = title;
      newSection.judges = judges;
      newSection.styles = styles;
      newSection.uuid = createResults.data.createSections.sections[0].uuid;

      if (brackets.length > 0) {
        setActiveTab(brackets[0].type.toLowerCase());
      } else {
        setActiveTab('');
      }

      updateSection(sectionIndex, newSection);
    }
  }, [createResults.loading, createResults.data]);

  useEffect(() => {
    if (!updateBracketResults.loading && updateBracketResults.data) {
      console.log('SUCCESSFUL UPDATE BRACKET');
      console.log(updateBracketResults.data);
      console.log(eventData.sections[sectionIndex]);
    }
  }, [updateBracketResults.loading, updateBracketResults.data]);

  return (
    <Card m="md" withBorder w="95%">
      <Group justify="space-between">
        <CloseButton
          onClick={() => handleDelete(sectionIndex)}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
        <Group>
          <Button onClick={() => handleSubmit()} color="green">
            Save
          </Button>
          <Button onClick={() => resetFields()}>Reset</Button>
          <Button color="red" onClick={() => updateBattlesSectionEditable(sectionIndex, false)}>
            Cancel
          </Button>
        </Group>
      </Group>
      <Center>
        <Stack component="center">
          <EditField title="Format" value={title} onChange={(value) => setTitle(value)} />
          <Group gap="6px">
            <Text fw="700">Judges:</Text>
            <UsersMultiSelect value={judges} onChange={(value) => setJudges(value)} />
          </Group>
          <Group gap="6px">
            <Text fw="700">Styles:</Text>
            <StringsMultiSelectCreatable
              value={styles}
              onChange={(value) => setStyles(value)}
              notExists={allStyles}
            />
          </Group>
        </Stack>
      </Center>

      <Stack mt="sm" p="0" justify="center" gap="lg">
        {brackets.map((bracket, index) => (
          <EditBracket
            key={index}
            bracketIndex={index}
            brackets={brackets}
            setBrackets={setBrackets}
          ></EditBracket>
        ))}
      </Stack>
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
