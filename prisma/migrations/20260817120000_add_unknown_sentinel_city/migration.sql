-- Country-less sentinel city for events whose location cannot be determined at
-- all -- neither city nor country. This is the parent of the existing
-- `unknown-{cc}` sentinels: those resolve to a country, this one does not.
--
-- Follows the `online` precedent exactly (see
-- 20260611120000_add_online_sentinel_city): the id is not a Google place_id by
-- design, so city code special-cases it instead of resolving it through Places.
-- countryCode '' satisfies NOT NULL -- there is no country to record, and ''
-- is how `online` already spells "no country". region NULL so surfaces render
-- the bare label "Unknown" the same way they render "Online". location stays
-- NULL to keep it out of nearest-city geo queries.
INSERT INTO "cities" ("id", "slug", "name", "countryCode", "region", "timezone", "latitude", "longitude", "location", "createdAt", "updatedAt")
VALUES ('unknown', 'unknown', 'Unknown', '', NULL, 'UTC', 0, 0, NULL, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;
