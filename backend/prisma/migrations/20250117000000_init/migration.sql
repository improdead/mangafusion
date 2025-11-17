-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('queued', 'in_progress', 'done', 'failed');

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "seedInput" JSONB NOT NULL,
    "outline" JSONB,
    "rendererModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "status" "PageStatus" NOT NULL,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "seed" INTEGER,
    "version" INTEGER DEFAULT 0,
    "error" TEXT,
    "overlays" JSONB,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assetFilename" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Episode_createdAt_idx" ON "Episode"("createdAt");

-- CreateIndex
CREATE INDEX "Episode_updatedAt_idx" ON "Episode"("updatedAt");

-- CreateIndex
CREATE INDEX "Page_episodeId_idx" ON "Page"("episodeId");

-- CreateIndex
CREATE INDEX "Page_status_idx" ON "Page"("status");

-- CreateIndex
CREATE INDEX "Page_episodeId_status_idx" ON "Page"("episodeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Page_episodeId_pageNumber_key" ON "Page"("episodeId", "pageNumber");

-- CreateIndex
CREATE INDEX "Character_episodeId_idx" ON "Character"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Character_episodeId_assetFilename_key" ON "Character"("episodeId", "assetFilename");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
