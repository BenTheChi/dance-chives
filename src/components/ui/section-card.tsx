import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface SectionCardProps {
  id: string;
  title: string;
  eventId: string;
  eventTitle: string;
}

export function SectionCard({
  id,
  title,
  eventId,
  eventTitle,
}: SectionCardProps) {
  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <CardContent className="p-4 sm:p-6">
        <Link href={`/event/${eventId}/sections`}>
          <h3 className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors mb-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {eventTitle}
          </p>
        </Link>
      </CardContent>
    </Card>
  );
}

