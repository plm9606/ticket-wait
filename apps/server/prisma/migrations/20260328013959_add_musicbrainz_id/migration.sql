/*
  Warnings:

  - A unique constraint covering the columns `[musicbrainzId]` on the table `Artist` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "musicbrainzId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Artist_musicbrainzId_key" ON "Artist"("musicbrainzId");
