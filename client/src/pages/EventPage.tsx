import { EventProvider } from '@/components/Providers/EventProvider';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Event } from '../components/Event';
import eventData from '../single-event-test.json';

const allUsers = ['user1', 'user2', 'user3', 'user4', 'user5'];

export function EventPage() {
  return (
    <BasicAppShell>
      <DarkModeToggle />
      <EventProvider initialEventData={eventData}>
        <Event />
      </EventProvider>
    </BasicAppShell>
  );
}
