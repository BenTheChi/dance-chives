CREATE TABLE "dance_styles" (
  "id"        SERIAL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "aliases"   TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dance_styles_name_key" UNIQUE ("name"),
  CONSTRAINT "dance_styles_slug_key" UNIQUE ("slug")
);

CREATE INDEX "dance_styles_slug_idx" ON "dance_styles"("slug");
