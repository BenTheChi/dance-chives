import {
  IconBook,
  IconCalendarMonth,
  IconCalendarStar,
  IconCoin,
  IconFriends,
} from '@tabler/icons-react';
import { NavLink } from '@mantine/core';

export function NavBar() {
  return (
    <>
      {[
        {
          href: '/events',
          key: 'events-nav',
          label: 'Events',
          icon: <IconCalendarStar size="1rem" stroke={1.5} />,
        },
        {
          href: '/series',
          key: 'series-nav',
          label: 'Series',
          icon: <IconCalendarMonth size="1rem" stroke={1.5} />,
        },
        {
          href: '/community',
          key: 'community-nav',
          label: 'Community',
          icon: <IconFriends size="1rem" stroke={1.5} />,
        },
        {
          href: '/education',
          key: 'education-nav',
          label: 'Education',
          icon: <IconBook size="1rem" stroke={1.5} />,
        },
        {
          href: '/support',
          key: 'support-nav',
          label: 'Support',
          icon: <IconCoin size="1rem" stroke={1.5} />,
        },
      ].map((link) => (
        <NavLink
          href={link.href}
          key={link.key}
          label={link.label}
          leftSection={link.icon}
          active={window.location.pathname === link.href}
        />
      ))}
    </>
  );
}
