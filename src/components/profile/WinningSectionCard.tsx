import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";

interface WinningSection {
  sectionId: string;
  sectionTitle: string;
  eventId: string;
  eventTitle: string;
  startDate?: string;
  imageUrl?: string;
  city?: string;
  cityId?: number;
}

interface WinningSectionCardProps {
  section: WinningSection;
}

export function WinningSectionCard({ section }: WinningSectionCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg mb-1">
              {section.sectionTitle}
            </h3>
            <Link
              href={`/event/${section.eventId}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {section.eventTitle}
            </Link>
          </div>

          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {section.startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(section.startDate).toLocaleDateString()}</span>
              </div>
            )}
            {section.city && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{section.city}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Link
              href={`/event/${section.eventId}`}
              className="text-xs text-blue-600 hover:underline"
            >
              View Event
            </Link>
            <span className="text-xs text-muted-foreground">•</span>
            <Link
              href={`/event/${section.eventId}/sections`}
              className="text-xs text-blue-600 hover:underline"
            >
              View Sections
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
