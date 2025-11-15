import { AppNavbar } from "@/components/AppNavbar";
import { getSessions } from "@/db/queries/session";
import { SessionCard } from "@/types/session";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { normalizeYouTubeThumbnailUrl } from "@/lib/utils";
import { StyleBadge } from "@/components/ui/style-badge";

export default async function SessionsPage() {
  const sessions = await getSessions();

  return (
    <>
      <main>
        <AppNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {sessions.map((session: SessionCard) => (
              <Card
                key={session.id}
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
              >
                <CardContent className="p-0">
                  <div className="relative aspect-video overflow-hidden rounded-t-lg">
                    <Link href={`/sessions/${session.id}`}>
                      <Image
                        src={normalizeYouTubeThumbnailUrl(session.imageUrl)}
                        alt={session.title}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </Link>
                  </div>

                  <div className="sm:p-4 space-y-2 sm:space-y-3">
                    <Link href={`/sessions/${session.id}`}>
                      <h3 className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
                        {session.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {session.date}
                    </p>
                    {session.cityId ? (
                      <Link
                        href={`/cities/${session.cityId}`}
                        className="text-sm text-muted-foreground hover:text-blue-600 hover:underline transition-colors"
                      >
                        {session.city}
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {session.city}
                      </p>
                    )}
                    {session.cost && (
                      <p className="text-sm font-medium">{session.cost}</p>
                    )}
                    {session.styles && session.styles.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {session.styles.slice(0, 3).map((style) => (
                          <StyleBadge
                            key={style}
                            style={style}
                            asLink={false}
                          />
                        ))}
                        {session.styles.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{session.styles.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

