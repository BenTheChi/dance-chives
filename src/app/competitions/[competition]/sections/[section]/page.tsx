import { AppNavbar } from "@/components/AppNavbar";
import SectionBracketTabSelector from "@/components/SectionBracketTabSelector";
import { getSection } from "@/db/queries/competition";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ competition: string; section: string }>;
};

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  // UUID v4 format: 8-4-4-4-12 hexadecimal characters
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to validate competition ID format
function isValidCompetitionId(id: string): boolean {
  const invalidPatterns = [
    /\.(svg|png|jpg|jpeg|gif|ico|css|js|json|xml|txt|pdf|doc|docx)$/i,
    /^(logo|favicon|robots|sitemap|manifest)/i,
  ];

  return !invalidPatterns.some((pattern) => pattern.test(id));
}

export default async function SectionPage({ params }: PageProps) {
  const paramResult = await params;

  // Validate inputs
  if (!isValidUUID(paramResult.section) || !isValidCompetitionId(paramResult.competition)) {
    notFound();
  }

  // Query by competitionId + section UUID
  const sectionData = await getSection(paramResult.section, paramResult.competition);

  if (!sectionData) {
    notFound();
  }

  const { section, eventId, eventTitle } = sectionData;

  return (
    <>
      <AppNavbar />
      <div className="p-5">
        <SectionBracketTabSelector
          section={section}
          eventTitle={eventTitle}
          eventId={eventId}
        />
      </div>
    </>
  );
}

