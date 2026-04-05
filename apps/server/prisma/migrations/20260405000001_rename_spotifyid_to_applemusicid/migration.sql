-- rename spotifyId → appleMusicId (String? @unique → Int? @unique)
ALTER TABLE "Artist" DROP COLUMN "spotifyId";
ALTER TABLE "Artist" ADD COLUMN "appleMusicId" INTEGER;
CREATE UNIQUE INDEX "Artist_appleMusicId_key" ON "Artist"("appleMusicId");
