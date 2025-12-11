import { AppNavbar } from "@/components/AppNavbar";
import { getEvent } from "@/db/queries/event";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import { Section } from "@/types/event";

type PageProps = {
  params: Promise<{ event: string }>;
};

// Helper function to validate event ID format
function isValidEventId(id: string): boolean {
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

  const event = await getEvent(paramResult.event);
  const sections = event.sections;
  const title = event.eventDetails.title;

  return (
    <>
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            asChild
            variant="secondary"
            className="hover:bg-gray-300 hover:shadow-none hover:cursor-pointer shadow-md"
          >
            <Link href={`/events/${paramResult.event}`}>Back to {title}</Link>
          </Button>
          <h1 className="text-3xl font-bold">Sections</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {sections.map((section: Section) => (
            <SectionCard
              key={section.id}
              section={section}
              eventId={paramResult.event}
            />
          ))}
        </div>
        {sections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No sections found.</p>
          </div>
        )}
      </div>
    </>
  );
}
