import { EventProvider } from '@/components/Providers/EventProvider';
import { BasicAppShell } from '../components/AppShell/BasicAppShell';
import { DarkModeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Event } from '../components/Event';
import eventData from '../single-event-test.json';

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
