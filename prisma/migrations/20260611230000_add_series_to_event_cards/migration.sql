-- Edition-agnostic series name (e.g. "Freestyle Session"), mirroring the
-- Neo4j Event.series property written by the auto-manager publish path.
-- Optional; not surfaced in UI yet.
ALTER TABLE "event_cards" ADD COLUMN "series" TEXT;
