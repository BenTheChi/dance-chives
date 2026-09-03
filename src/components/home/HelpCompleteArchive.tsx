import Link from "next/link";
import type { ArchiveStats } from "@/db/queries/archive-stats";

/**
 * The gap band: what the machine could not work out, stated as an invitation.
 *
 * The counts are live, so this is a standing, honest measure of what is left
 * to do rather than a slogan. In Phase 1 it links into `/events` where the
 * "Needs info" filter is; Phase 3 replaces that with the card queue.
 *
 * Amber rather than red, for the same reason as the inline affordances: these
 * gaps are the expected output of machine extraction, not a fault.
 */
export function HelpCompleteArchive({ stats }: { stats: ArchiveStats }) {
  const hasGaps = stats.missingCityCount > 0 || stats.impreciseDateCount > 0;
  if (!hasGaps) return null;

  return (
    <section className="max-w-6xl mx-auto w-full rounded-sm py-8 px-4 sm:px-6 border-4 border-[#b4801f] bg-[#b4801f]/12">
      <h2 className="!text-3xl sm:!text-4xl text-center mb-4 !font-rubik-mono-one text-[#e0a942]">
        Help Complete the Archive
      </h2>

      <p className="text-center !text-lg max-w-2xl mx-auto mb-2">
        This archive was built by machine from YouTube, so some of it is
        incomplete.
      </p>

      <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 my-6 text-center">
        {stats.missingCityCount > 0 && (
          <div className="flex flex-col">
            <span className="font-rubik-mono-one text-3xl sm:text-4xl text-[#e0a942] tabular-nums">
              {stats.missingCityCount.toLocaleString()}
            </span>
            <span className="text-sm">events are missing a city</span>
          </div>
        )}
        {stats.impreciseDateCount > 0 && (
          <div className="flex flex-col">
            <span className="font-rubik-mono-one text-3xl sm:text-4xl text-[#e0a942] tabular-nums">
              {stats.impreciseDateCount.toLocaleString()}
            </span>
            <span className="text-sm">only know their month or year</span>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto mb-6">
        If you were there, you probably know more than the machine did.
      </p>

      <div className="flex justify-center">
        <Link
          href="/events"
          className="inline-flex items-center rounded-sm border-2 border-[#b4801f] bg-[#b4801f] px-6 py-3 font-rubik-mono-one text-charcoal transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a942]"
        >
          See what&apos;s missing
        </Link>
      </div>
    </section>
  );
}
