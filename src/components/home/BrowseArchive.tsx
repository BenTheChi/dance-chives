import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BrowseFacet } from "@/db/queries/archive-stats";

/**
 * The real navigation into the archive, promoted to the position it earns.
 *
 * Every chip carries a live count, which is the point: a visitor can see that
 * Breaking has 650 events before clicking, so the archive proves its depth
 * during navigation rather than after it.
 */
function FacetRow({
  title,
  facets,
  emptyLabel,
}: {
  title: string;
  facets: BrowseFacet[];
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="!text-xl !font-bold">{title}</h3>
      {facets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {facets.map((facet) => (
            <Link
              key={facet.href}
              href={facet.href}
              className="inline-flex items-center gap-2 rounded-sm border-2 border-primary-light bg-charcoal/40 px-3 py-1.5 text-sm font-bold transition-colors hover:bg-primary-light hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
            >
              {facet.label}
              <span className="text-xs opacity-70 tabular-nums">
                {facet.count.toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

export function BrowseArchive({
  styles,
  cities,
}: {
  styles: BrowseFacet[];
  cities: BrowseFacet[];
}) {
  return (
    <section className="max-w-6xl mx-auto w-full bg-primary rounded-sm py-8 px-4 sm:px-6 border-4 border-primary-light">
      <h2 className="!text-4xl sm:!text-5xl text-center mb-8 !font-rubik-mono-one text-outline">
        Browse the Archive
      </h2>

      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <FacetRow
          title="By style"
          facets={styles}
          emptyLabel="No styles recorded yet."
        />
        <FacetRow
          title="By city"
          facets={cities}
          emptyLabel="No cities recorded yet."
        />
      </div>

      <div className="flex justify-center mt-8">
        <Link href="/events">
          <Button
            size="xl"
            className="font-rubik-mono-one text-base sm:text-xl text-charcoal !bg-accent-blue px-6 sm:px-10"
          >
            See all events
          </Button>
        </Link>
      </div>
    </section>
  );
}
