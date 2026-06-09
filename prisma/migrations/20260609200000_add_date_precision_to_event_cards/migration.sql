-- Auto-imported events often only know their year (sometimes month).
-- datePrecision ('day'|'month'|'year') drives honest date rendering;
-- existing human-entered rows are full dates, hence the 'day' default.
ALTER TABLE "event_cards" ADD COLUMN "datePrecision" TEXT NOT NULL DEFAULT 'day';
