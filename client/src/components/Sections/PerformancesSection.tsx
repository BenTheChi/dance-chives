import { useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { IconCirclePlus, IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Grid, Group, ScrollArea, Title } from '@mantine/core';
import { DELETE_PERFORMANCE_SECTION } from '@/gql/returnQueries';
import { IPerformancesSection } from '@/types/types';
import { PerformanceCard } from '../Cards/PerformanceCard';
import { useEventContext } from '../Providers/EventProvider';

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function PerformancesSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData, addCard, deleteSection } = useEventContext();

  const currentSection = eventData.sections[sectionIndex] as IPerformancesSection;

  const [deletePerformancesSection, deleteResults] = useMutation(DELETE_PERFORMANCE_SECTION);

  const handleDelete = () => {
    if (eventData.sections[sectionIndex].uuid === '') {
      deleteSection(sectionIndex);
    } else {
      deletePerformancesSection({
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
        Performances
      </Title>
      <ScrollArea h={450}>
        <Grid justify="flex-start" align="stretch" p="sm">
          {currentSection.uuid !== '' && (
            <Grid.Col span={4} order={-1}>
              <Button onClick={() => addCard(sectionIndex)} variant="outline" h="100%" w="100%">
                <Group align="center" justify="space-between">
                  <IconCirclePlus size={100} />
                  <Title order={4}>Add Performance</Title>
                </Group>
              </Button>
            </Grid.Col>
          )}

          {currentSection.performanceCards.map((performanceCard, index) => {
            return (
              <Grid.Col
                span={4}
                order={currentSection.performanceCards.length - index}
                key={currentSection.performanceCards.length - index}
              >
                <PerformanceCard key={index} cardIndex={index} sectionIndex={sectionIndex} />
              </Grid.Col>
            );
          })}
        </Grid>
      </ScrollArea>
    </Card>
  );
}
