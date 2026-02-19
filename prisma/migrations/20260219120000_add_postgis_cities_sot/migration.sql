CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "region" TEXT,
    "timezone" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geography(Point, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");
CREATE INDEX "cities_name_idx" ON "cities"("name");
CREATE INDEX "cities_region_idx" ON "cities"("region");
CREATE INDEX "cities_countryCode_idx" ON "cities"("countryCode");
CREATE INDEX "cities_updatedAt_idx" ON "cities"("updatedAt");
CREATE INDEX "cities_location_gix" ON "cities" USING GIST ("location");
CREATE INDEX "cities_name_trgm_idx" ON "cities" USING GIN (LOWER("name") gin_trgm_ops);
CREATE INDEX "cities_region_trgm_idx" ON "cities" USING GIN (LOWER(COALESCE("region", '')) gin_trgm_ops);
