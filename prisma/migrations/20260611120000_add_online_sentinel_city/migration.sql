-- Sentinel city for online-only events (e.g. online qualifiers). The id is
-- not a Google place_id by design: city code special-cases 'online' instead
-- of resolving it through Places. countryCode '' satisfies NOT NULL; the
-- event_cards rows written against it carry NULL region/country so cards
-- render the bare label "Online". location stays NULL to keep it out of
-- nearest-city geo queries.
INSERT INTO "cities" ("id", "slug", "name", "countryCode", "region", "timezone", "latitude", "longitude", "location", "createdAt", "updatedAt")
VALUES ('online', 'online', 'Online', '', NULL, 'UTC', 0, 0, NULL, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;
