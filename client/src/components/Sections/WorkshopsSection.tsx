import { useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { IconCirclePlus, IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Grid, Group, ScrollArea, Title } from '@mantine/core';
import { DELETE_WORKSHOP_SECTION } from '@/gql/returnQueries';
import { IWorkshopsSection } from '@/types/types';
import { WorkshopCard } from '../Cards/WorkshopCard';
import { useEventContext } from '../Providers/EventProvider';

export function WorkshopsSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData, deleteSection, addCard } = useEventContext();
  const currentSection = eventData.sections[sectionIndex] as IWorkshopsSection;

  const [deleteWorkshopsSection, deleteResults] = useMutation(DELETE_WORKSHOP_SECTION);

  const handleDelete = () => {
    if (eventData.sections[sectionIndex].uuid === '') {
      deleteSection(sectionIndex);
    } else {
      deleteWorkshopsSection({
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

  return (
    <Card m="md" withBorder w="95%">
      <Group justify="space-between">
        <CloseButton
          onClick={() => handleDelete()}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
      </Group>
      <Title component={Center} order={3}>
        Workshops
      </Title>
      <ScrollArea h={450}>
        <Grid justify="flex-start" align="stretch" p="sm">
          {currentSection.uuid !== '' && (
            <Grid.Col span={4} order={-1}>
              <Button onClick={() => addCard(sectionIndex)} variant="outline" h="375" w="460">
                <Group align="center" justify="space-between">
                  <IconCirclePlus size={100} />
                  <Title order={4}>Add Workshop</Title>
                </Group>
              </Button>
            </Grid.Col>
          )}

          {currentSection.workshopCards.map((workshopCard, index) => {
            return (
              <Grid.Col
                span={4}
                order={currentSection.workshopCards.length - index}
                key={currentSection.workshopCards.length - index}
              >
                <WorkshopCard key={index} cardIndex={index} sectionIndex={sectionIndex} />
              </Grid.Col>
            );
          })}
        </Grid>
      </ScrollArea>
    </Card>
  );
}
