import {
  IconBook,
  IconCalendarMonth,
  IconCalendarStar,
  IconCoin,
  IconFriends,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { NavLink } from '@mantine/core';

export function NavBar() {
  return (
    <>
      {[
        {
          to: '/events',
          key: 'events-nav',
          label: 'Events',
          icon: <IconCalendarStar size="1rem" stroke={1.5} />,
        },
        {
          to: '/series',
          key: 'series-nav',
          label: 'Series',
          icon: <IconCalendarMonth size="1rem" stroke={1.5} />,
        },
        {
          to: '/community',
          key: 'community-nav',
          label: 'Community',
          icon: <IconFriends size="1rem" stroke={1.5} />,
        },
        {
          to: '/education',
          key: 'education-nav',
          label: 'Education',
          icon: <IconBook size="1rem" stroke={1.5} />,
        },
        {
          to: '/support',
          key: 'support-nav',
          label: 'Support',
          icon: <IconCoin size="1rem" stroke={1.5} />,
        },
      ].map((link) => (
        <NavLink
          component={Link}
          to={link.to}
          key={link.key}
          label={link.label}
          leftSection={link.icon}
          active={window.location.pathname === link.to}
        />
      ))}
    </>
  );
}
