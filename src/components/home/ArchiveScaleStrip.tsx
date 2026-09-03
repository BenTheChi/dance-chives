import Link from "next/link";
import type { ArchiveStats } from "@/db/queries/archive-stats";

/**
 * The scale strip: the archive's size, stated plainly, directly under the hero.
 *
 * This exists because the numbers ARE the product. A visitor who does not know
 * that 16,000+ battle videos are searchable here has no reason to look further,
 * and nothing else on the page conveys it. Sits below the logo/Open Beta block,
 * never in place of it.
 */
export function ArchiveScaleStrip({ stats }: { stats: ArchiveStats }) {
  const items: Array<{ value: string; label: string; href: string }> = [
    {
      value: stats.videoCount.toLocaleString(),
      label: "battle videos",
      href: "/watch",
    },
    {
      value: stats.eventCount.toLocaleString(),
      label: "events",
      href: "/events",
    },
    {
      value: stats.cityCount.toLocaleString(),
      label: "cities",
      href: "/cities",
    },
  ];

  return (
    <section className="max-w-6xl mx-auto w-full px-4">
      <div className="border-4 border-primary-light rounded-sm bg-charcoal/60 px-4 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-center">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex flex-col items-center min-w-[110px] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
            >
              <span className="font-rubik-mono-one text-2xl sm:text-4xl text-primary-light group-hover:text-white transition-colors tabular-nums">
                {item.value}
              </span>
              <span className="text-sm sm:text-base tracking-wide">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
