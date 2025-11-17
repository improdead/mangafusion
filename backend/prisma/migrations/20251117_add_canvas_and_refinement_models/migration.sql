-- CreateTable
CREATE TABLE "Canvas" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "canvasData" JSONB,
    "thumbnailUrl" TEXT,
    "width" INTEGER NOT NULL DEFAULT 1024,
    "height" INTEGER NOT NULL DEFAULT 1024,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Canvas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefinementVersion" (
    "id" TEXT NOT NULL,
    "canvasId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "originalSketchUrl" TEXT,
    "refinedImageUrl" TEXT NOT NULL,
    "promptDescription" TEXT,
    "style" TEXT NOT NULL DEFAULT 'manga',
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "controlnetType" TEXT NOT NULL DEFAULT 'scribble',
    "aiProvider" TEXT NOT NULL DEFAULT 'segmind',
    "processingTimeMs" INTEGER,
    "qualityScore" DOUBLE PRECISION,
    "userAccepted" BOOLEAN NOT NULL DEFAULT false,
    "isCurrentVersion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefinementVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Canvas_pageId_key" ON "Canvas"("pageId");

-- CreateIndex
CREATE INDEX "Canvas_pageId_idx" ON "Canvas"("pageId");

-- CreateIndex
CREATE INDEX "Canvas_updatedAt_idx" ON "Canvas"("updatedAt");

-- CreateIndex
CREATE INDEX "RefinementVersion_canvasId_idx" ON "RefinementVersion"("canvasId");

-- CreateIndex
CREATE INDEX "RefinementVersion_pageId_idx" ON "RefinementVersion"("pageId");

-- CreateIndex
CREATE INDEX "RefinementVersion_userAccepted_idx" ON "RefinementVersion"("userAccepted");

-- CreateIndex
CREATE INDEX "RefinementVersion_isCurrentVersion_idx" ON "RefinementVersion"("isCurrentVersion");

-- CreateIndex
CREATE INDEX "RefinementVersion_createdAt_idx" ON "RefinementVersion"("createdAt");

-- AddForeignKey
ALTER TABLE "Canvas" ADD CONSTRAINT "Canvas_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefinementVersion" ADD CONSTRAINT "RefinementVersion_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
