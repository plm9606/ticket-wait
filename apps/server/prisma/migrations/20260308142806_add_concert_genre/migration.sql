-- CreateEnum
CREATE TYPE "ConcertGenre" AS ENUM ('CONCERT', 'FESTIVAL', 'FANMEETING', 'MUSICAL', 'CLASSIC', 'HIPHOP', 'TROT', 'OTHER');

-- AlterTable
ALTER TABLE "Concert" ADD COLUMN     "genre" "ConcertGenre" NOT NULL DEFAULT 'CONCERT';

-- CreateIndex
CREATE INDEX "Concert_genre_idx" ON "Concert"("genre");
