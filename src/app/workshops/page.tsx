import { AppNavbar } from "@/components/AppNavbar";
import { getWorkshops } from "@/db/queries/workshop";
import { WorkshopCard } from "@/types/workshop";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { normalizeYouTubeThumbnailUrl } from "@/lib/utils";
import { StyleBadge } from "@/components/ui/style-badge";

export default async function WorkshopsPage() {
  const workshops = await getWorkshops();

  return (
    <>
      <main>
        <AppNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {workshops.map((workshop: WorkshopCard) => (
              <Card
                key={workshop.id}
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
              >
                <CardContent className="p-0">
                  <div className="relative aspect-video overflow-hidden rounded-t-lg">
                    <Link href={`/workshops/${workshop.id}`}>
                      <Image
                        src={normalizeYouTubeThumbnailUrl(workshop.imageUrl)}
                        alt={workshop.title}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </Link>
                  </div>

                  <div className="sm:p-4 space-y-2 sm:space-y-3">
                    <Link href={`/workshops/${workshop.id}`}>
                      <h3 className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
                        {workshop.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {workshop.date}
                    </p>
                    {workshop.cityId ? (
                      <Link
                        href={`/cities/${workshop.cityId}`}
                        className="text-sm text-muted-foreground hover:text-blue-600 hover:underline transition-colors"
                      >
                        {workshop.city}
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {workshop.city}
                      </p>
                    )}
                    {workshop.cost && (
                      <p className="text-sm font-medium">{workshop.cost}</p>
                    )}
                    {workshop.styles && workshop.styles.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {workshop.styles.slice(0, 3).map((style) => (
                          <StyleBadge
                            key={style}
                            style={style}
                            asLink={false}
                          />
                        ))}
                        {workshop.styles.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{workshop.styles.length - 3}
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
