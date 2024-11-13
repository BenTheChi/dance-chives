import { useState } from 'react';
import { CloseButton, Combobox, TextInput, useCombobox } from '@mantine/core';

const roles = ['🍎 Apples', '🍌 Bananas', '🥦 Broccoli', '🥕 Carrots', '🍫 Chocolate', '🍇 Grapes'];

interface AutocompleteClearableProps {
  roles: string[];
}

export function AutocompleteClearable({ roles }: AutocompleteClearableProps) {
  const combobox = useCombobox();
  const [value, setValue] = useState(roles[0]);
  const shouldFilterOptions = !roles.some((item) => item === value);
  const filteredOptions = shouldFilterOptions
    ? roles.filter((item) => item.toLowerCase().includes(value.toLowerCase().trim()))
    : roles;

  const options = filteredOptions.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  return (
    <Combobox
      onOptionSubmit={(optionValue) => {
        setValue(optionValue);
        combobox.closeDropdown();
      }}
      store={combobox}
      withinPortal={false}
    >
      <Combobox.Target>
        <TextInput
          placeholder="Pick a role"
          value={value}
          onChange={(event) => {
            setValue(event.currentTarget.value);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
          rightSection={
            value !== '' && (
              <CloseButton
                size="sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setValue('')}
                aria-label="Clear value"
              />
            )
          }
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options.length === 0 ? <Combobox.Empty>Nothing found</Combobox.Empty> : options}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
