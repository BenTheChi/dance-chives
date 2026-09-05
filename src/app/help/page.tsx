import Link from "next/link";
import { getArchiveStats } from "@/db/queries/archive-stats";
import { HelpSearch } from "./help-search";

/**
 * The help hub.
 *
 * ## Why this was rewritten rather than edited
 *
 * The previous version documented a different product. Every page was written
 * for someone who created an event and manages it — request ownership, wait for
 * approval, open the event form. But the archive is now ~1,073 events built by
 * machine from YouTube, essentially none of which have a creator, so that path
 * could never work for the people actually reading it.
 *
 * ## Two tracks
 *
 * Almost everyone here is a visitor who noticed something wrong; a few are
 * organisers managing their own page. Those are different jobs and they now
 * have different tracks, rather than one undifferentiated FAQ that served the
 * rarer case first.
 *
 * ## Numbers are live
 *
 * The gap counts come from `getArchiveStats`, the same source as the homepage.
 * A help page that states a number is a help page that goes stale; this one
 * cannot, and the counts double as the argument for contributing.
 */

export const revalidate = 3600;

export const metadata = {
  title: "Help — Dance Chives",
  description:
    "How to fix, add to, and manage events on the Dance Chives archive.",
};

/** A step in a numbered walkthrough. Deliberately capped at four per task. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-secondary-light font-bold">
        {n}
      </span>
      <div className="space-y-1 pt-0.5">
        <h4 className="font-bold leading-tight">{title}</h4>
        <div className="text-sm text-muted-foreground leading-relaxed">
          {children}
        </div>
      </div>
    </li>
  );
}

function Card({
  title,
  children,
  href,
  cta,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-sm border-2 border-secondary-light bg-background/50 p-5 space-y-3">
      <h3 className="text-lg font-bold">{title}</h3>
      <div className="text-sm leading-relaxed space-y-2">{children}</div>
      {href && cta ? (
        <Link href={href} className="inline-block text-sm underline">
          {cta} →
        </Link>
      ) : null}
    </div>
  );
}

export default async function HelpPage() {
  const stats = await getArchiveStats();

  return (
    <div className="flex flex-col gap-10 w-full max-w-5xl mx-auto p-6 md:p-8 pb-16">
      <header className="space-y-3">
        <h1>Help</h1>
        <p className="text-lg leading-relaxed max-w-3xl">
          Dance Chives is an archive of{" "}
          <strong>{stats.videoCount.toLocaleString()} videos</strong> across{" "}
          <strong>{stats.eventCount.toLocaleString()} events</strong>, built
          automatically from YouTube channels. Because a machine assembled it,
          parts of it are wrong or missing — and anyone with an account can fix
          them.
        </p>
      </header>

      <HelpSearch />

      {/* ── Track 1: contributing ─────────────────────────────── */}
      <section className="space-y-5">
        <div className="border-b-2 border-secondary-light pb-2">
          <h2 className="text-2xl font-bold">Fixing and adding information</h2>
          <p className="text-sm text-muted-foreground mt-1">
            For anyone with an account. No permission needed.
          </p>
        </div>

        <div className="rounded-sm border-2 border-secondary-light bg-background/50 p-6">
          <h3 className="text-lg font-bold mb-4">Fix a fact in two steps</h3>
          <ol className="space-y-4">
            <Step n={1} title="Hover or tap the fact on an event page">
              City, date, and styles each show what we know and how sure we are.
              A missing one appears as a dashed{" "}
              <span className="whitespace-nowrap">&ldquo;+ Add city&rdquo;</span>{" "}
              button instead of a blank.
            </Step>
            <Step n={2} title="Enter what you know and save">
              That&apos;s it. Your change is live immediately — no review queue,
              no waiting for approval.
            </Step>
          </ol>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="What happens to my change?">
            <p>
              It applies right away and is recorded under your name. Moderators
              can undo any change, and the previous value is always kept — so
              nothing is ever lost, and an honest mistake is not a disaster.
            </p>
          </Card>

          <Card title="Do I need to own the event?">
            <p>
              No. Almost no event here has an owner — they were imported
              automatically. Owning a page is only needed to manage it (posters,
              sections, team), never to correct a fact.
            </p>
          </Card>

          <Card title="What if I&rsquo;m only half sure?">
            <p>
              Say so. When you fix a date you choose how certain you are — exact
              day, month, or just the year. Saying &ldquo;month only&rdquo; is
              genuinely useful: it keeps the event on the list of things we still
              want to pin down, instead of pretending we know the day.
            </p>
          </Card>

          <Card title="Can I break something?">
            <p>
              Not permanently. Every change keeps the value it replaced, and a
              moderator can restore it in one click. Cities are matched against a
              real place list, and styles against the site&apos;s style list, so
              typos can&apos;t create phantom entries.
            </p>
          </Card>
        </div>

        {/* The live gap band: the reason to contribute, stated as fact. */}
        <div className="rounded-sm border-4 border-[#b4801f] bg-[#b4801f]/12 p-6">
          <h3 className="text-lg font-bold mb-3 text-[#e0a942]">
            What needs help right now
          </h3>
          <div className="flex flex-wrap gap-x-10 gap-y-4 mb-4">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-[#e0a942] tabular-nums">
                {stats.missingCityCount.toLocaleString()}
              </span>
              <span className="text-sm">events missing a city</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-[#e0a942] tabular-nums">
                {stats.impreciseDateCount.toLocaleString()}
              </span>
              <span className="text-sm">
                events without an exact date
              </span>
            </div>
          </div>
          <p className="text-sm mb-4">
            If you were there, you probably know more than the machine did.
          </p>
          <Link
            href="/events"
            className="inline-block rounded-sm border-2 border-[#b4801f] bg-[#b4801f] px-5 py-2 font-bold text-charcoal transition-transform hover:scale-105"
          >
            See what&apos;s missing
          </Link>
        </div>
      </section>

      {/* ── Track 2: managing ─────────────────────────────────── */}
      <section className="space-y-5">
        <div className="border-b-2 border-secondary-light pb-2">
          <h2 className="text-2xl font-bold">Managing an event</h2>
          <p className="text-sm text-muted-foreground mt-1">
            For organisers and their teams. Needs ownership or team access.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            title="Claim an event page"
            href="/help/page-ownership"
            cta="How ownership works"
          >
            <p>
              If an event is yours, request ownership to manage its page,
              posters, and team. This is the one thing that still needs approval.
            </p>
          </Card>

          <Card
            title="Add or edit an event"
            href="/help/add-edit-events"
            cta="The event form, tab by tab"
          >
            <p>
              Details, roles, sections, brackets, and photos — the full form for
              events you own or help run.
            </p>
          </Card>

          <Card
            title="Team, visibility, deletion"
            href="/help/event-management"
            cta="Managing your event"
          >
            <p>
              Add team members, hide an event from public listings, transfer
              ownership, or remove an event entirely.
            </p>
          </Card>

          <Card
            title="Tag yourself and others"
            href="/help/role-tagging"
            cta="Roles and tagging"
          >
            <p>
              Credit dancers, judges, DJs, and hosts on events and battles,
              including people who aren&apos;t registered yet.
            </p>
          </Card>
        </div>
      </section>

      {/* ── Roadmap ───────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="border-b-2 border-secondary-light pb-2">
          <h2 className="text-2xl font-bold">What&apos;s coming</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Dance Chives is in beta. Themes, not promises — no dates attached.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-sm border-2 border-secondary-light bg-background/50 p-5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[#e0a942]">
              Now
            </span>
            <h3 className="font-bold">Corrections</h3>
            <p className="text-sm leading-relaxed">
              Fixing a city, date, or style from the event page itself, with
              every change reversible. Live today.
            </p>
          </div>

          <div className="rounded-sm border-2 border-secondary-light bg-background/50 p-5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[#e0a942]">
              Next
            </span>
            <h3 className="font-bold">One question at a time</h3>
            <p className="text-sm leading-relaxed">
              A queue that asks one thing you might know — &ldquo;what city was
              this?&rdquo; — instead of asking you to hunt for gaps. Plus
              tagging who danced in a battle.
            </p>
          </div>

          <div className="rounded-sm border-2 border-secondary-light bg-background/50 p-5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[#e0a942]">
              Exploring
            </span>
            <h3 className="font-bold">Dancer profiles</h3>
            <p className="text-sm leading-relaxed">
              Once enough battles are tagged, a profile that shows where
              you&apos;ve danced and who you&apos;ve battled — built from the
              archive itself.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Everything in the beta is free and stays free. Paid tiers for crews and
          businesses are planned for a later launch.{" "}
          <Link href="/about" className="underline">
            More about the project
          </Link>
          .
        </p>
      </section>

      {/* ── Basics ────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="border-b-2 border-secondary-light pb-2">
          <h2 className="text-2xl font-bold">The basics</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="How the archive is organised">
            <p>
              An <strong>event</strong> holds <strong>sections</strong> (prelims,
              top 16, showcases), and a section holds <strong>videos</strong>.
              Battle sections are split into <strong>brackets</strong> — the
              rounds of the competition.
            </p>
          </Card>

          <Card title="Finding things">
            <p>
              Filter events by city, style, or date, or switch{" "}
              <Link href="/events" className="underline">
                the events list
              </Link>{" "}
              to &ldquo;Needs info&rdquo; to see what&apos;s incomplete. The{" "}
              <Link href="/calendar" className="underline">
                calendar
              </Link>{" "}
              shows upcoming and past events by month.
            </p>
          </Card>

          <Card title="Accounts">
            <p>
              Sign in with Google or a magic link. You need an account to
              contribute, be tagged, or manage an event — browsing needs nothing.
            </p>
          </Card>

          <Card title="Something wrong that isn&rsquo;t a fact?">
            <p>
              Corrections handle wrong information. For anything else — a video
              that shouldn&apos;t be here, a dispute, a takedown — use the report
              link in the footer.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
