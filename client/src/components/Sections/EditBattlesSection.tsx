import { useEffect, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
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
import { deepDiff, ObjectComparison } from '@/utilities/utility';
import { EditBracket } from '../EditBracket';
import { MultiSelectCreatable } from '../Inputs/MultiSelectCreatable';
import { useEventContext } from '../Providers/EventProvider';

const notExists = ['Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];
const allStyles = ['Breaking', 'Popping', 'Locking', 'Hip Hop', 'House', 'Waacking', 'Vogue'];

export function EditBattlesSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData, deleteSection, updateBattlesSection, updateBattlesSectionEditable } =
    useEventContext();

  //Create a copy of the value to avoid direct context changes
  const currentSection = JSON.parse(JSON.stringify(eventData.sections[sectionIndex]));

  const UPDATE_EVENTS = gql`
    mutation UpdateEvents($where: EventWhere!, $update: EventUpdateInput!) {
      updateEvents(where: $where, update: $update) {
        events {
          uuid
          title
          date
          addressName
          address
          cost
          prizes
          description
          recapVideo
          images
          inCity {
            name
          }
          styles {
            name
          }
          organizers {
            displayName
          }
          djs {
            displayName
          }
          mcs {
            displayName
          }
          videographers {
            displayName
          }
          photographers {
            displayName
          }
          graphicDesigners {
            displayName
          }
        }
      }
    }
  `;

  const [updateEvents, { data, loading, error }] = useMutation(UPDATE_EVENTS);

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

  const handleSubmit = () => {
    // console.log(eventData.sections[sectionIndex]);
    // console.log(judges);
    // console.log(styles);

    console.log(eventData.sections[sectionIndex], {
      format: title,
      judges: judges,
      styles: styles,
      brackets: brackets,
    });

    const changes = deepDiff(eventData.sections[sectionIndex], {
      format: title,
      judges: judges,
      styles: styles,
      brackets: brackets,
    });

    console.log(changes);

    // const roles = ['organizers', 'mcs', 'djs', 'videographers', 'photographers'];

    // roles.forEach((role) => {
    //   if (changes[role]) {
    //     const roleList = createConnectOrCreateList(changes[role], role.slice(0, -1));

    //     changes[role] = {
    //       disconnect: [{ where: {} }],
    //       connectOrCreate: roleList,
    //     };
    //   }
    // });

    // if (changes.styles) {
    //   const styleList = changes.styles.map((style: String) => {
    //     return {
    //       where: {
    //         node: {
    //           name: style,
    //         },
    //       },
    //       onCreate: {
    //         node: {
    //           name: style,
    //         },
    //       },
    //     };
    //   });

    //   changes.styles = {
    //     disconnect: [{ where: {} }],
    //     connectOrCreate: styleList,
    //   };
    // }

    // updateEvents({
    //   variables: {
    //     where: {
    //       uuid: eventData.uuid,
    //     },
    //     update: {
    //       where: {
    //         uuid: eventData.sections[sectionIndex].uuid,
    //       },
    //     },
    //   },
    // });
    updateBattlesSection(sectionIndex, {
      uuid: currentSection.uuid,
      type: 'battles',
      format: title,
      judges: judges,
      styles: styles,
      brackets: brackets,
      isEditable: false,
    });
  };

  useEffect(() => {
    // Re-render the component when brackets change
  }, [eventData]);

  useEffect(() => {
    if (!loading && data) {
      console.log(data);
      // let newData = data.updateEvents.events[0];
      // newData.city = newData.inCity.name;

      // newData.organizers?.length &&
      //   (newData.organizers = newData.organizers.map((organizer: any) => organizer.displayName));
      // newData.mcs?.length && (newData.mcs = newData.mcs.map((mc: any) => mc.displayName));
      // newData.djs?.length && (newData.djs = newData.djs.map((dj: any) => dj.displayName));
      // newData.videographers?.length &&
      //   (newData.videographers = newData.videographers.map(
      //     (videographer: any) => videographer.displayName
      //   ));
      // newData.photographers?.length &&
      //   (newData.photographers = newData.photographers.map(
      //     (photographer: any) => photographer.displayName
      //   ));
      // newData.styles?.length && (newData.styles = newData.styles.map((style: any) => style.name));

      // setEventData({ ...eventData, ...newData });
    }
  }, [loading, data]);

  return (
    <Card m="md" withBorder>
      <Group justify="space-between">
        <CloseButton
          onClick={() => deleteSection(sectionIndex)}
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
