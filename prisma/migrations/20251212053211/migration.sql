-- CreateEnum
CREATE TYPE "EventDateKind" AS ENUM ('timed', 'allDay');

-- CreateTable
CREATE TABLE "event_cards" (
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventType" TEXT,
    "cityId" INTEGER,
    "cityName" TEXT,
    "region" TEXT,
    "countryCode" TEXT,
    "eventTimezone" TEXT,
    "posterUrl" TEXT,
    "styles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "displayDateLocal" TEXT,
    "additionalDatesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_cards_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "event_dates" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "kind" "EventDateKind" NOT NULL,
    "startUtc" TIMESTAMPTZ(6) NOT NULL,
    "endUtc" TIMESTAMPTZ(6),
    "localDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_cards" (
    "sectionId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sectionType" TEXT,
    "posterUrl" TEXT,
    "styles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalVideoCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_cards_pkey" PRIMARY KEY ("sectionId")
);

-- CreateTable
CREATE TABLE "user_cards" (
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "imageUrl" TEXT,
    "cityId" INTEGER,
    "cityName" TEXT,
    "styles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_cards_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "event_cards_cityId_idx" ON "event_cards"("cityId");

-- CreateIndex
CREATE INDEX "event_cards_eventType_idx" ON "event_cards"("eventType");

-- CreateIndex
CREATE INDEX "event_cards_updatedAt_idx" ON "event_cards"("updatedAt");

-- CreateIndex
CREATE INDEX "event_cards_styles_idx" ON "event_cards" USING GIN ("styles");

-- CreateIndex
CREATE INDEX "event_dates_eventId_startUtc_idx" ON "event_dates"("eventId", "startUtc");

-- CreateIndex
CREATE INDEX "event_dates_startUtc_idx" ON "event_dates"("startUtc");

-- CreateIndex
CREATE INDEX "section_cards_eventId_idx" ON "section_cards"("eventId");

-- CreateIndex
CREATE INDEX "section_cards_styles_idx" ON "section_cards" USING GIN ("styles");

-- CreateIndex
CREATE UNIQUE INDEX "user_cards_username_key" ON "user_cards"("username");

-- CreateIndex
CREATE INDEX "user_cards_cityId_idx" ON "user_cards"("cityId");

-- CreateIndex
CREATE INDEX "user_cards_styles_idx" ON "user_cards" USING GIN ("styles");

-- CreateIndex
CREATE INDEX "user_cards_updatedAt_idx" ON "user_cards"("updatedAt");

-- AddForeignKey
ALTER TABLE "event_dates" ADD CONSTRAINT "event_dates_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event_cards"("eventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_cards" ADD CONSTRAINT "section_cards_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event_cards"("eventId") ON DELETE CASCADE ON UPDATE CASCADE;
