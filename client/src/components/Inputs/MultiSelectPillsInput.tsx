import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, Combobox, Group, Pill, PillsInput, useCombobox } from '@mantine/core';
import { useUserContext } from '../Providers/UserProvider';

interface MultiSelectPillsInputProps {
  users: {
    displayName: string;
    username: string;
  }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  authLevel: number;
}

export function MultiSelectPillsInput({
  users,
  selected,
  onChange,
  authLevel,
}: MultiSelectPillsInputProps) {
  const { userData } = useUserContext();
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const [search, setSearch] = useState('');

  const handleValueSelect = (username: string) => {
    onChange(
      selected.includes(username) ? selected.filter((v) => v !== username) : [...selected, username]
    );
  };

  const handleValueRemove = (username: string) => {
    onChange(selected.filter((v) => v !== username));
  };

  // Determine if remove button should be shown based on authLevel and ownership
  const shouldShowRemoveButton = (username: string) => {
    if (authLevel === -1) return false;
    if (authLevel === 0) return username === userData?.username;
    return true;
  };

  const values = selected.map((username) => {
    const user = users.find((u) => u.username === username);
    if (!user) return null;

    const pill = (
      <Pill
        key={username}
        withRemoveButton={shouldShowRemoveButton(username)}
        onRemove={() => handleValueRemove(username)}
      >
        {user.displayName}
      </Pill>
    );

    return (
      <Link to={`/profile/${username}`} key={username}>
        {pill}
      </Link>
    );
  });

  // Filter available users based on authLevel
  const availableUsers = users.filter((user) => {
    if (authLevel === -1) return false;
    if (authLevel === 0) return user.username === userData?.username;
    return true;
  });

  const options = availableUsers
    .filter((user) => user.displayName.toLowerCase().includes(search.trim().toLowerCase()))
    .map((user) => (
      <Combobox.Option
        value={user.username}
        key={user.username}
        active={selected.includes(user.username)}
      >
        <Group gap="sm">
          {selected.includes(user.username) ? <CheckIcon size={12} /> : null}
          <span>{user.displayName}</span>
        </Group>
      </Combobox.Option>
    ));

  return (
    <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
      <Combobox.DropdownTarget>
        <PillsInput onClick={() => authLevel >= 0 && combobox.openDropdown()}>
          <Pill.Group>
            {values}

            <Combobox.EventsTarget>
              <PillsInput.Field
                onFocus={() => authLevel >= 0 && combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                value={search}
                disabled={authLevel === -1}
                placeholder={authLevel >= 0 ? 'Search users' : 'No permission to select users'}
                onChange={(event) => {
                  combobox.updateSelectedOptionIndex();
                  setSearch(event.currentTarget.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && search.length === 0 && selected.length > 0) {
                    event.preventDefault();
                    const lastUsername = selected[selected.length - 1];
                    if (shouldShowRemoveButton(lastUsername)) {
                      handleValueRemove(lastUsername);
                    }
                  }
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options.length > 0 ? options : <Combobox.Empty>Nothing found...</Combobox.Empty>}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

export default MultiSelectPillsInput;
