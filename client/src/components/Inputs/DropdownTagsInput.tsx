import React, { useState } from 'react';
import { TagsInput } from '@mantine/core';

const testData = {
  defaultMenuValue: 'Dancers',
  exists: [
    { id: '1', name: 'Bboy Hong 10' },
    { id: '2', name: 'Rina Pellerin' },
    { id: '3', name: 'Ben Chi' },
  ],
  notExists: ['John', 'Steve', 'Alice'],
};

interface DropdownTagsInputProps {
  allMenuValues: string[];
  defaultMenuValue: string;
  exists: { id: string; name: string }[];
  notExists: string[];
}

export function DropdownTagsInput({
  allMenuValues,
  defaultMenuValue,
  exists,
  notExists,
}: DropdownTagsInputProps) {
  const [value, setValue] = useState<string[]>([]);

  return (
    <TagsInput
      label="Press Enter to submit a tag"
      data={notExists}
      value={value}
      onChange={setValue}
      placeholder={`Add ${defaultMenuValue}`}
    />
  );
}
