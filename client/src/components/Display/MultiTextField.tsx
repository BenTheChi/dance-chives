import { IconUserPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { ActionIcon, Group, Pill, Text, Tooltip } from '@mantine/core';
import { UserBasicInfo } from '@/types/types';
import { useUserContext } from '../Providers/UserProvider';

export function MultiTextField({
  values,
  updateEvent,
  title,
}: {
  values: UserBasicInfo[];
  updateEvent: (value: UserBasicInfo[], role: string) => void;
  title: string;
}) {
  const { userData, loggedIn } = useUserContext();
  let hasUser = false;

  values = values.filter((value) => {
    if (value.username === userData.username) {
      hasUser = true;
      return false;
    }
    return true;
  });

  const handleRemove = () => {
    const updatedValues = values.filter((user) => user.username !== userData.username);
    updateEvent(updatedValues, title.toLowerCase());
  };

  const handleAdd = () => {
    const updatedValues = [
      ...values,
      { username: userData.username, displayName: userData.displayName },
    ];
    updateEvent(updatedValues, title.toLowerCase());
  };

  return (
    <Group gap="6px">
      <Text fw="700">{title}: </Text>
      {values.map((value, index) => (
        <Pill
          key={index}
          styles={{
            root: {
              backgroundColor: '#cae3fa',
              border: '1px solid #90CAF9',
            },
          }}
        >
          <Link to={`/profile/${value.username}`} style={{ color: 'blue', textDecoration: 'none' }}>
            {value.displayName}
          </Link>
        </Pill>
      ))}
      {loggedIn &&
        (hasUser ? (
          <Pill
            styles={{
              root: {
                backgroundColor: '#48a832',
                border: '1px solid #90CAF9',
              },
              remove: {
                color: 'red',
              },
            }}
            withRemoveButton
            onRemove={() => handleRemove()}
          >
            <Link
              to={`/profile/${userData.username}`}
              style={{ color: 'blue', textDecoration: 'none' }}
            >
              {userData.displayName}
            </Link>
          </Pill>
        ) : (
          <Tooltip label="Tag yourself">
            <ActionIcon
              variant="light"
              color="green"
              size="sm"
              radius="xl"
              aria-label="Settings"
              onClick={() => handleAdd()}
            >
              <IconUserPlus style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        ))}
    </Group>
  );
}
