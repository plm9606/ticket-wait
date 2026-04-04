/*
  Warnings:

  - You are about to drop the column `concertId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the `Concert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CrawlLog` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `performanceId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PerformanceGenre" AS ENUM ('CONCERT', 'FESTIVAL', 'FANMEETING', 'MUSICAL', 'CLASSIC', 'HIPHOP', 'TROT', 'OTHER');

-- CreateEnum
CREATE TYPE "PerformanceStatus" AS ENUM ('UPCOMING', 'ON_SALE', 'SOLD_OUT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- DropForeignKey
ALTER TABLE "Concert" DROP CONSTRAINT "Concert_artistId_fkey";

-- DropForeignKey
ALTER TABLE "FcmToken" DROP CONSTRAINT "FcmToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_concertId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_artistId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropIndex
DROP INDEX "Artist_nameEn_idx";

-- DropIndex
DROP INDEX "Artist_name_idx";

-- DropIndex
DROP INDEX "Notification_userId_sentAt_idx";

-- DropIndex
DROP INDEX "Subscription_artistId_idx";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "concertId",
ADD COLUMN     "performanceId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Concert";

-- DropTable
DROP TABLE "CrawlLog";

-- DropEnum
DROP TYPE "ConcertGenre";

-- DropEnum
DROP TYPE "ConcertStatus";

-- DropEnum
DROP TYPE "CrawlStatus";

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kopisId" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "seatScale" INTEGER,
    "phone" TEXT,
    "website" TEXT,
    "sido" TEXT,
    "gugun" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Performance" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistId" TEXT,
    "venueId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "ticketOpenDate" TIMESTAMP(3),
    "source" "TicketSource" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "rawTitle" TEXT NOT NULL,
    "kopisId" TEXT,
    "genre" "PerformanceGenre" NOT NULL,
    "status" "PerformanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "newItems" INTEGER NOT NULL DEFAULT 0,
    "updatedItems" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "status" "SyncStatus" NOT NULL DEFAULT 'RUNNING',

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Venue_kopisId_key" ON "Venue"("kopisId");

-- CreateIndex
CREATE INDEX "Performance_kopisId_idx" ON "Performance"("kopisId");

-- CreateIndex
CREATE UNIQUE INDEX "Performance_source_sourceId_key" ON "Performance"("source", "sourceId");
