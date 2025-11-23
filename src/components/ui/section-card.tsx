import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SectionCardProps {
  id: string;
  title: string;
  sectionType?: string;
  eventId: string;
  eventTitle: string;
}

export function SectionCard({
  id,
  title,
  sectionType,
  eventId,
  eventTitle,
}: SectionCardProps) {
  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <CardContent className="p-4 sm:p-6">
        <Link href={`/events/${eventId}/sections/${id}`} className="block">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
              {title}
            </h3>
            {sectionType && (
              <Badge variant="outline" className="text-xs">
                {sectionType}
              </Badge>
            )}
          </div>
        </Link>
        <p className="text-sm text-muted-foreground">
          <Link
            href={`/events/${eventId}`}
            className="hover:text-blue-600 transition-colors"
          >
            {eventTitle}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
