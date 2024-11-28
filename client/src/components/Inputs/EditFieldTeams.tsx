import { Text, Textarea } from '@mantine/core';

export function EditFieldTeams({
  title,
  value,
  index,
  onChange,
}: {
  title: string;
  value: string;
  index: number;
  onChange: (newValue: string, index: number) => void;
}) {
  const initialValue = value;

  return (
    <>
      <Text fw="bold">{title}:</Text>
      <Textarea
        autosize
        minRows={1}
        w="350"
        pb="sm"
        value={initialValue}
        onChange={(event) => onChange(event.currentTarget.value, index)}
      />
    </>
  );
}
