import { IconCirclePlus, IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Grid, Group, ScrollArea, Title } from '@mantine/core';
import { IPerformancesSection } from '@/types/types';
import { PerformanceCard } from '../Cards/PerformanceCard';
import { useEventContext } from '../Providers/EventProvider';

//Use this for choreography, non-dance performances, showcases, exhibition battles, etc.
export function PerformancesSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData, addCard, deleteSection } = useEventContext();

  const currentSection = eventData.sections[sectionIndex] as IPerformancesSection;

  console.log(currentSection);

  return (
    <Card m="md" withBorder w="95%">
      <Group justify="space-between">
        <CloseButton
          onClick={() => deleteSection(sectionIndex)}
          icon={<IconSquareXFilled size={40} stroke={1.5} />}
        />
      </Group>
      <Title component={Center} order={3}>
        Performances
      </Title>
      <ScrollArea h={450}>
        <Grid justify="flex-start" align="stretch" p="sm">
          <Grid.Col span={4}>
            <Button onClick={() => addCard(sectionIndex)} variant="outline" h="375" w="460">
              <Group align="center" justify="space-between">
                <IconCirclePlus size={100} />
                <Title order={4}>Add Performance</Title>
              </Group>
            </Button>
          </Grid.Col>

          {currentSection.performanceCards.map((performanceCard, index) => {
            return (
              <Grid.Col span={4}>
                <PerformanceCard key={index} cardIndex={index} sectionIndex={sectionIndex} />
              </Grid.Col>
            );
          })}
        </Grid>
      </ScrollArea>
    </Card>
  );
}
