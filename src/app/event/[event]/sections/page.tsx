import { AppNavbar } from "@/components/AppNavbar";
import SectionBracketTabSelector from "@/components/SectionBracketTabSelector";
import { getEventSections } from "@/db/queries/event";
import { notFound } from "next/navigation";
import { auth } from "@/auth";

type PageProps = {
  params: Promise<{ event: string }>;
};

// Helper function to validate event ID format
function isValidEventId(id: string): boolean {
  // Event IDs should not contain file extensions or be static asset names
  const invalidPatterns = [
    /\.(svg|png|jpg|jpeg|gif|ico|css|js|json|xml|txt|pdf|doc|docx)$/i,
    /^(logo|favicon|robots|sitemap|manifest)/i,
  ];

  return !invalidPatterns.some((pattern) => pattern.test(id));
}

export default async function SectionsPage({ params }: PageProps) {
  const paramResult = await params;

  // Validate the event ID before trying to fetch it
  if (!isValidEventId(paramResult.event)) {
    notFound();
  }

  const { sections, title } = await getEventSections(paramResult.event);
  const session = await auth();

  return (
    <>
      <AppNavbar />
      <SectionBracketTabSelector
        sections={sections}
        eventTitle={title}
        eventId={paramResult.event}
        currentUserId={session?.user?.id}
      />
    </>
  );
}
