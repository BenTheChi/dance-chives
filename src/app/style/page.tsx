import { AppNavbar } from "@/components/AppNavbar";
import { getAllStyles } from "@/db/queries/event";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";

export default async function StylesPage() {
  const styles = await getAllStyles();

  return (
    <>
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Dance Styles</h1>
        <p className="text-muted-foreground mb-8">
          Browse all available dance styles and explore related events, sections, and videos
        </p>

        {styles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {styles.map((style) => {
              const displayStyle = formatStyleNameForDisplay(style);
              return (
                <Card
                  key={style}
                  className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                >
                  <CardContent className="p-4 sm:p-6">
                    <Link href={`/style/${encodeURIComponent(style)}`}>
                      <h3 className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
                        {displayStyle}
                      </h3>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No styles found in the database.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

