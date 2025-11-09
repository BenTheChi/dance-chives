import Image from "next/image";
import React from "react";
import Link from "next/link";
import { EventCard } from "@/types/event";
import { Card, CardContent } from "@/components/ui/card";
import { StyleBadge } from "@/components/ui/style-badge";
import { Badge } from "@/components/ui/badge";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";

interface EventcardProps extends EventCard {
  roles?: string[];
}

const Eventcard = ({
  id,
  title,
  series,
  imageUrl,
  date,
  city,
  cityId,
  styles,
  roles,
}: EventcardProps) => {
  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <Link href={`/event/${id}`}>
            <Image
              src={imageUrl || "/exploreEvents.jpg"}
              alt={title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </Link>
        </div>

        <div className="sm:p-4 space-y-2 sm:space-y-3">
          <Link href={`/event/${id}`}>
            <h3 className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
              {title}
            </h3>
          </Link>
          {series && <p className="text-sm text-muted-foreground">{series}</p>}
          <p className="text-sm text-muted-foreground">{date}</p>
          {cityId ? (
            <Link
              href={`/city/${cityId}`}
              className="text-sm text-muted-foreground hover:text-blue-600 hover:underline transition-colors"
            >
              {city}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">{city}</p>
          )}

          {styles && styles.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {styles.map((style) => (
                <StyleBadge key={style} style={style} />
              ))}
            </div>
          )}

          {roles && roles.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {roles.map((role, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {fromNeo4jRoleFormat(role) || role}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Eventcard;
