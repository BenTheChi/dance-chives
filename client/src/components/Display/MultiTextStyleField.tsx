import { Link } from 'react-router-dom';
import { Group, Pill, Text } from '@mantine/core';

export function MultiTextStyleField({ values }: { values: string[] }) {
  return (
    <Group gap="6px">
      <Text fw="700">Styles: </Text>
      {values.map((value, index) => (
        <Pill
          key={index}
          styles={{
            root: {
              backgroundColor: '#d7b0f5', // Light blue that works well in both themes
              border: '1px solid #90CAF9', // Slightly darker blue border for definition
            },
          }}
        >
          <Link
            key={index}
            to={`/styles/${value}`}
            style={{ color: 'blue', textDecoration: 'none' }}
          >
            {value}
          </Link>
        </Pill>
      ))}
    </Group>
  );
}
