import { Avatar, Card, Group, Stack, Text, Title } from '@mantine/core';

export function ProfileSection({ userData }: { userData: any }) {
  return (
    <Card withBorder shadow="sm" radius="md" m="md">
      <Group align="flex-start" wrap="nowrap">
        <Avatar size={150} src={userData.image} alt={userData.displayName} radius="md" />
        <Stack gap="0">
          <Title order={2}>{userData.displayName}</Title>
          <Text c="dimmed" size="sm">
            @{userData.username}
          </Text>
          <Text>{userData.aboutme || 'No bio yet...'}</Text>
          <Text>📍 {userData.city.name || 'Location not set'}</Text>
          {userData.socials && userData.socials.length > 0 && (
            <Group gap="xs">
              {userData.socials.map((social: string, index: number) => (
                <Text key={index} size="sm" c="blue">
                  {social}
                </Text>
              ))}
            </Group>
          )}
        </Stack>
      </Group>
    </Card>
  );
}
