import { Group, Text } from '@mantine/core';

export function TextField({ title, value }: { title: string; value: string }) {
  return (
    <Group gap="6px">
      <Text fw="700">{title}: </Text> <Text> {value}</Text>
    </Group>
  );
}
