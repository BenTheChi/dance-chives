"use client";

import Image from "next/image";
import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { EventCard } from "@/types/event";
import { CardWithPoster, CardContent } from "@/components/ui/card";
import { StyleBadge } from "@/components/ui/style-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { useToggleSave } from "@/hooks/use-toggle-save";

interface EventcardProps extends EventCard {
  roles?: string[];
  href?: string; // Optional href for the title link, defaults to /events/${id}
  isSaved?: boolean;
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
  href,
  isSaved,
}: EventcardProps) => {
  const titleHref = href || `/events/${id}`;
  const { isSaved: savedState, toggle, isPending } = useToggleSave(
    isSaved ?? false,
    id
  );

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  return (
    <CardWithPoster className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <Image
            src={imageUrl || "/exploreEvents.jpg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <Button
            variant={savedState ? "default" : "outline"}
            size="icon"
            className={`absolute top-2 right-2 h-8 w-8 rounded-full ${
              savedState
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-white/90 hover:bg-white text-gray-700"
            } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={handleHeartClick}
            disabled={isPending}
            aria-label={savedState ? "Unsave event" : "Save event"}
          >
            <Heart
              className={`h-4 w-4 ${savedState ? "fill-current" : ""}`}
            />
          </Button>
        </div>

        <div className="sm:p-4 space-y-2 sm:space-y-3">
          <Link href={titleHref}>
            <h3 className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
              {title}
            </h3>
          </Link>
          {series && <p className="text-sm text-muted-foreground">{series}</p>}
          <p className="text-sm text-muted-foreground">{date}</p>
          {cityId ? (
            <Link
              href={`/cities/${cityId}`}
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
    </CardWithPoster>
  );
};

export default Eventcard;
