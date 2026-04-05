-- CreateTable
CREATE TABLE "PerformanceArtist" (
    "performanceId" INTEGER NOT NULL,
    "artistId" INTEGER NOT NULL,

    CONSTRAINT "PerformanceArtist_pkey" PRIMARY KEY ("performanceId","artistId")
);

-- CreateIndex
CREATE INDEX "PerformanceArtist_artistId_idx" ON "PerformanceArtist"("artistId");

-- Migrate existing artistId data into junction table
INSERT INTO "PerformanceArtist" ("performanceId", "artistId")
SELECT "id", "artistId"
FROM "Performance"
WHERE "artistId" IS NOT NULL;

-- AlterTable: drop artistId column after data migration
ALTER TABLE "Performance" DROP COLUMN "artistId";
