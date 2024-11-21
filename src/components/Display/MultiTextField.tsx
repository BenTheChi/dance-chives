import { Link } from 'react-router-dom';
import { Group, Text } from '@mantine/core';

export function MultiTextField({ title, values }: { title: string; values: string[] }) {
  return (
    <Group gap="6px">
      <Text fw="700">{title}: </Text>
      {values.map((value, index) => (
        <Link key={index} to="#">
          {value}
        </Link>
      ))}
    </Group>
  );
}
