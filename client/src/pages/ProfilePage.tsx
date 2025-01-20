import { useQuery } from '@apollo/client';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Avatar, Card, Grid, Group, ScrollArea, Stack, Tabs, Text, Title } from '@mantine/core';
import { Video } from '@/components/Video';
import { getUser } from '@/gql/returnQueries';
import { ICity, UserBasicInfo } from '@/types/types';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { EventCard } from '../components/Cards/EventCard';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

interface GQLUser {
  uuid: string;
  username: string;
  displayName: string;
  aboutme?: string;
  image?: string;
  socials?: string[];
  city: ICity;
  organizes: {
    uuid: string;
    title: string;
    date: number;
    images: string[];
    inCity: ICity;
    styles: { name: string }[];
  }[];
  mcs: {
    uuid: string;
    title: string;
    date: number;
    images: string[];
    inCity: ICity;
    styles: { name: string }[];
  }[];
  djs: {
    uuid: string;
    title: string;
    date: number;
    images: string[];
    inCity: ICity;
    styles: { name: string }[];
  }[];
  videographs: {
    uuid: string;
    title: string;
    date: number;
    images: string[];
    inCity: ICity;
    styles: { name: string }[];
  }[];
  photographs: {
    uuid: string;
    title: string;
    date: number;
    images: string[];
    inCity: ICity;
    styles: { name: string }[];
  }[];
  graphicDesigns: {
    uuid: string;
    title: string;
    date: number;
    images: string[];
    inCity: ICity;
    styles: { name: string }[];
  }[];
  judges: {
    uuid: string;
    type: string;
    format: string;
    styles: { name: string }[];
    partOfEvent: {
      uuid: string;
      title: string;
      date: number;
      inCity: ICity;
    }[];
  }[];
  dancesInBattleCards: {
    uuid: string;
    title: string;
    src: string;
    winners: UserBasicInfo[];
    inBrackets: {
      inSections: {
        partOfEvent: {
          uuid: string;
          title: string;
          titleSlug: string;
          date: number;
          inCity: ICity;
        }[];
      }[];
    }[];
  }[];
  teachesInWorkshopCards: {
    uuid: string;
    title: string;
    date: number;
    cost: string;
    address: string;
    image: string;
    recapSrc: string;
    styles: { name: string }[];
    inSections: {
      partOfEvent: {
        uuid: string;
        title: string;
        date: number;
        inCity: ICity;
      }[];
    };
  }[];
}

export function ProfilePage() {
  const { id } = useParams();
  const { loading, data } = useQuery(getUser(id || ''));
  useLocation();

  if (loading || !data) {
    return <div>Loading...</div>;
  }

  const userData: GQLUser = data.users[0];

  // Prepare role tabs data
  const roleTabs = [
    { value: 'organizer', label: 'Organizer', events: userData.organizes },
    { value: 'mc', label: 'MC', events: userData.mcs },
    { value: 'dj', label: 'DJ', events: userData.djs },
    { value: 'videographer', label: 'Videographer', events: userData.videographs },
    { value: 'photographer', label: 'Photographer', events: userData.photographs },
    { value: 'graphic-designer', label: 'Graphic Designer', events: userData.graphicDesigns },
    {
      value: 'teacher',
      label: 'Teacher',
      events: userData.teachesInWorkshopCards.map((card) => ({
        uuid: card.inSections.partOfEvent[0].uuid,
        title: card.inSections.partOfEvent[0].title,
        date: card.inSections.partOfEvent[0].date,
        inCity: card.inSections.partOfEvent[0].inCity,
        images: [card.image],
        styles: card.styles,
      })),
    },
  ].filter((tab) => tab.events.length > 0);

  // Prepare battle cards data
  const battleCards = userData.dancesInBattleCards.map((card) => ({
    ...card,
    isWinner: card.winners.some((winner) => winner.username === userData.username),
    partOfEvent: card.inBrackets[0].inSections[0].partOfEvent,
  }));

  return (
    <BasicAppShell>
      <DarkModeToggle />

      {/* Profile Section */}
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
                {userData.socials.map((social, index) => (
                  <Text key={index} size="sm" c="blue">
                    {social}
                  </Text>
                ))}
              </Group>
            )}
          </Stack>
        </Group>
      </Card>

      {/* Roles Section */}
      {roleTabs.length > 0 && (
        <Card withBorder shadow="sm" radius="md" m="md">
          <Title order={3} mb="md">
            Roles
          </Title>
          <Tabs defaultValue={roleTabs[0].value}>
            <Tabs.List>
              {roleTabs.map((tab) => (
                <Tabs.Tab key={tab.value} value={tab.value}>
                  {tab.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>

            {roleTabs.map((tab) => (
              <Tabs.Panel key={tab.value} value={tab.value}>
                <ScrollArea h={400}>
                  <Grid gutter="md" p="md">
                    {tab.events.map((event) => (
                      <Grid.Col key={event.uuid} span={4}>
                        <EventCard
                          title={event.title}
                          date={event.date}
                          city={event.inCity}
                          styles={event.styles?.map((s) => s.name) || []}
                          images={event.images}
                        />
                      </Grid.Col>
                    ))}
                  </Grid>
                </ScrollArea>
              </Tabs.Panel>
            ))}
          </Tabs>
        </Card>
      )}

      {/* Battles Section */}
      {battleCards.length > 0 && (
        <Card withBorder shadow="sm" radius="md" m="md">
          <Title order={3} mb="md">
            Battles
          </Title>
          <ScrollArea h={450}>
            <Grid justify="flex-start" align="stretch" p="sm">
              {battleCards.map((card, index) => (
                <Grid.Col key={card.uuid} span={4}>
                  <Card
                    withBorder
                    shadow="sm"
                    radius="md"
                    style={{
                      backgroundColor: card.isWinner ? 'rgba(50, 220, 50, 0.1)' : undefined,
                      borderColor: card.isWinner ? 'green' : undefined,
                    }}
                  >
                    <Stack gap="xs">
                      <Title order={4}>{card.title}</Title>
                      <Video title={card.title} src={card.src} />
                      <Text>🏆 {card.partOfEvent[0].title}</Text>
                      <Text>📍 {card.partOfEvent[0].inCity.name}</Text>
                      <Text>
                        📅 {new Date(card.partOfEvent[0].date * 1000).toLocaleDateString()}
                      </Text>
                      <Text>
                        <Link to={`/event/${card.partOfEvent[0].titleSlug}`}>View Event</Link>
                      </Text>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </ScrollArea>
        </Card>
      )}
    </BasicAppShell>
  );
}
