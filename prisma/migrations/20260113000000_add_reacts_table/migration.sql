-- CreateTable
CREATE TABLE "reacts" (
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "fire" INTEGER NOT NULL DEFAULT 0,
    "clap" INTEGER NOT NULL DEFAULT 0,
    "wow" INTEGER NOT NULL DEFAULT 0,
    "heart" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "reacts_pkey" PRIMARY KEY ("userId","videoId")
);

-- CreateIndex
CREATE INDEX "reacts_videoId_idx" ON "reacts"("videoId");

-- AddForeignKey
ALTER TABLE "reacts" ADD CONSTRAINT "reacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
