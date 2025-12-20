import { AppNavbar } from "@/components/AppNavbar";
import { getAllStyles } from "@/db/queries/event";
import { StyleCard } from "@/components/StyleCard";

export default async function StylesPage() {
  const styles = await getAllStyles();

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col items-center justify-center px-4 py-8">
        <h1 className="!text-[60px] mt-5 mb-12">Dance Styles</h1>

        {styles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-10">
            {styles.map((style) => (
              <StyleCard
                key={style}
                style={style}
                href={`/styles/${encodeURIComponent(style)}`}
              />
            ))}
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
