import { AppNavbar } from "@/components/AppNavbar";
import SectionBracketTabSelector from "@/components/SectionBracketTabSelector";
import { getEvent } from "@/db/queries/event";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ event: string; section: string }>;
};

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  // UUID v4 format: 8-4-4-4-12 hexadecimal characters
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to validate event ID format
function isValidEventId(id: string): boolean {
  const invalidPatterns = [
    /\.(svg|png|jpg|jpeg|gif|ico|css|js|json|xml|txt|pdf|doc|docx)$/i,
    /^(logo|favicon|robots|sitemap|manifest)/i,
  ];

  return !invalidPatterns.some((pattern) => pattern.test(id));
}

export default async function SectionPage({ params }: PageProps) {
  const paramResult = await params;

  // Validate inputs
  if (!isValidUUID(paramResult.section) || !isValidEventId(paramResult.event)) {
    notFound();
  }

  // Get event and find the section
  const event = await getEvent(paramResult.event);
  const section = event.sections.find((s) => s.id === paramResult.section);

  if (!section) {
    notFound();
  }

  return (
    <>
      <AppNavbar />
      <div className="p-5">
        <SectionBracketTabSelector
          section={section}
          eventTitle={event.eventDetails.title}
          eventId={event.id}
        />
      </div>
    </>
  );
}

