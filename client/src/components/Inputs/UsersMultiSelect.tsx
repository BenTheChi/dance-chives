import { useEffect, useRef, useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import {
  Center,
  CheckIcon,
  Combobox,
  Group,
  Loader,
  Pill,
  PillsInput,
  useCombobox,
} from '@mantine/core';
import { UserBasicInfo } from '@/types/types';

const SEARCH_USERS = gql`
  query SearchUsers($keyword: String!) {
    users(where: { displayName_CONTAINS: $keyword }) {
      username
      displayName
    }
  }
`;

interface MenuInputProps {
  onChange: (selected: UserBasicInfo[]) => void;
  value: UserBasicInfo[];
}

export function UsersMultiSelect({ onChange, value }: MenuInputProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const [search, setSearch] = useState('');
  const [data, setData] = useState<UserBasicInfo[]>([...value]);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const [fetchUsers, { loading }] = useLazyQuery(SEARCH_USERS, {
    onCompleted: (data) => {
      if (data?.users) {
        setData(Array.from(new Set([...data.users, ...value])));
      }
    },
  });

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (search.trim()) {
      searchTimeout.current = setTimeout(() => {
        fetchUsers({ variables: { keyword: search.trim() } });
      }, 1500);
    } else {
      setData([...value]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search, fetchUsers, value]);

  const handleValueSelect = (val: string) => {
    setSearch('');
    const selectedUser = data.find((user) => user.username === val);
    if (!selectedUser) return;

    onChange(
      value.some((item) => item.username === val)
        ? value.filter((v) => v.username !== val)
        : [...value, selectedUser]
    );
  };

  const handleValueRemove = (username: string) =>
    onChange(value.filter((v) => v.username !== username));

  const values = value.map((item) => (
    <Pill key={item.username} withRemoveButton onRemove={() => handleValueRemove(item.username)}>
      {item.displayName}
    </Pill>
  ));

  const filteredData = data.filter((item) =>
    item.displayName.toLowerCase().includes(search.trim().toLowerCase())
  );

  const options = filteredData.map((item) => (
    <Combobox.Option
      value={item.username}
      key={item.username}
      active={value.some((s) => s.username === item.username)}
    >
      <Group gap="sm">
        {value.some((s) => s.username === item.username) ? <CheckIcon size={12} /> : null}
        <span>{item.displayName}</span>
      </Group>
    </Combobox.Option>
  ));

  return (
    <Combobox store={combobox} onOptionSubmit={handleValueSelect} withinPortal={false}>
      <Combobox.DropdownTarget>
        <PillsInput onClick={() => combobox.openDropdown()}>
          <Pill.Group>
            {values}

            <Combobox.EventsTarget>
              <PillsInput.Field
                onFocus={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                value={search}
                placeholder="Search users"
                onChange={(event) => {
                  combobox.updateSelectedOptionIndex();
                  setSearch(event.currentTarget.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && search.length === 0) {
                    event.preventDefault();
                    const lastSelected = value[value.length - 1];
                    if (lastSelected) {
                      handleValueRemove(lastSelected.username);
                    }
                  }
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Options mah={200} style={{ overflow: 'auto' }}>
          {loading ? (
            <Center p="xs">
              <Loader size="sm" />
            </Center>
          ) : (
            <>
              {options}
              {filteredData.length === 0 && search.trim().length > 0 && (
                <Combobox.Empty>Nothing found</Combobox.Empty>
              )}
            </>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
