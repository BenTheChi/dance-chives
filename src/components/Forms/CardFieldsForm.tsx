import React, { useState } from 'react';
import { IconX } from '@tabler/icons-react';
import {
  Button,
  Combobox,
  Group,
  InputBase,
  Select,
  Stack,
  TextInput,
  useCombobox,
} from '@mantine/core';

type FieldType = 'Videographer' | 'DJ' | 'Dancers';

interface FieldConfig {
  type: FieldType;
  isMulti: boolean;
}

const FIELD_CONFIGS: Record<FieldType, FieldConfig> = {
  Videographer: { type: 'Videographer', isMulti: false },
  DJ: { type: 'DJ', isMulti: false },
  Dancers: { type: 'Dancers', isMulti: true },
};

const FIELD_OPTIONS = Object.keys(FIELD_CONFIGS) as FieldType[];

interface Field {
  id: string;
  type: FieldType;
  value: string | string[];
}

interface CreatableSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const CreatableSelect: React.FC<CreatableSelectProps> = ({ value, onChange }) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [search, setSearch] = useState('');

  const exactOptionMatch = value.some((item) => item === search);
  const filteredOptions = exactOptionMatch
    ? value
    : value.filter((item) => item.toLowerCase().includes(search.toLowerCase().trim()));

  const options = filteredOptions.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  const selectedValues = value.join(', ');

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        if (val === '$create') {
          onChange([...value, search]);
          setSearch('');
        } else {
          // Remove the selected value if it already exists
          onChange(value.filter((v) => v !== val));
          setSearch('');
        }
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          rightSection={<Combobox.Chevron />}
          value={search}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch('');
          }}
          placeholder={selectedValues || 'Add dancers...'}
          rightSectionPointerEvents="none"
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options}
          {!exactOptionMatch && search.trim().length > 0 && (
            <Combobox.Option value="$create">+ Add {search}</Combobox.Option>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

const DynamicForm: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);

  const usedFieldTypes = new Set(fields.map((field) => field.type));
  const availableFieldTypes = FIELD_OPTIONS.filter((type) => !usedFieldTypes.has(type));

  const addField = () => {
    const newField: Field = {
      id: crypto.randomUUID(),
      type: availableFieldTypes[0],
      value: FIELD_CONFIGS[availableFieldTypes[0]].isMulti ? [] : '',
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const updateFieldType = (id: string, newType: FieldType) => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          const newValue = FIELD_CONFIGS[newType].isMulti ? [] : '';
          return { ...field, type: newType, value: newValue };
        }
        return field;
      })
    );
  };

  const updateFieldValue = (id: string, newValue: string | string[]) => {
    setFields(fields.map((field) => (field.id === id ? { ...field, value: newValue } : field)));
  };

  const handleSubmit = async () => {
    try {
      const formData = fields.reduce(
        (acc, field) => ({
          ...acc,
          [field.type]: field.value,
        }),
        {}
      );

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit data');
      }

      setFields([]);
      alert('Data submitted successfully!');
    } catch (error) {
      console.error('Error submitting data:', error);
      alert('Failed to submit data. Please try again.');
    }
  };

  return (
    <Stack gap="md" w={500}>
      {fields.map((field) => (
        <Group key={field.id} gap="sm" align="flex-start">
          <Select
            value={field.type}
            onChange={(value) => updateFieldType(field.id, value as FieldType)}
            data={[field.type, ...availableFieldTypes]}
          />

          {FIELD_CONFIGS[field.type].isMulti ? (
            <div style={{ flex: 2 }}>
              <CreatableSelect
                value={field.value as string[]}
                onChange={(newValue) => updateFieldValue(field.id, newValue)}
              />
              {(field.value as string[]).length > 0 && (
                <Group gap="xs" mt="xs">
                  {(field.value as string[]).map((item) => (
                    <Button
                      key={item}
                      size="xs"
                      variant="light"
                      rightIcon={<IconX size={14} />}
                      onClick={() => {
                        updateFieldValue(
                          field.id,
                          (field.value as string[]).filter((v) => v !== item)
                        );
                      }}
                    >
                      {item}
                    </Button>
                  ))}
                </Group>
              )}
            </div>
          ) : (
            <TextInput
              placeholder="Enter value"
              value={field.value as string}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
            />
          )}

          <Button
            variant="subtle"
            color="red"
            onClick={() => removeField(field.id)}
            p={0}
            w={30}
            h={30}
          >
            <IconX size={20} />
          </Button>
        </Group>
      ))}

      <Group gap="sm">
        <Button onClick={addField} variant="outline" disabled={availableFieldTypes.length === 0}>
          Add field
        </Button>
        <Button onClick={handleSubmit} disabled={fields.length === 0}>
          Submit
        </Button>
      </Group>
    </Stack>
  );
};

export default DynamicForm;
