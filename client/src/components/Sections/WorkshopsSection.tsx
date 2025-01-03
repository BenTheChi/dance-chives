import { IconCirclePlus, IconSquareXFilled } from '@tabler/icons-react';
import { Button, Card, Center, CloseButton, Grid, Group, ScrollArea, Title } from '@mantine/core';
import { IWorkshopsSection } from '@/types/types';
import { WorkshopCard } from '../Cards/WorkshopCard';
import { useEventContext } from '../Providers/EventProvider';

export function WorkshopsSection({ sectionIndex }: { sectionIndex: number }) {
  const { eventData, deleteSection, addCard } = useEventContext();
  const currentSection = eventData.sections[sectionIndex] as IWorkshopsSection;

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
        Workshops
      </Title>
      <ScrollArea h={450}>
        <Grid justify="flex-start" align="stretch" p="sm">
          {currentSection.uuid !== '' && (
            <Grid.Col span={4}>
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
              <Grid.Col span={4}>
                <WorkshopCard key={index} cardIndex={index} sectionIndex={sectionIndex} />
              </Grid.Col>
            );
          })}
        </Grid>
      </ScrollArea>
    </Card>
  );
}
