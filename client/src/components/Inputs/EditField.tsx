import { Group, Text, Textarea } from '@mantine/core';

export function EditField({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (newValue: string) => void;
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
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </>
  );
}
