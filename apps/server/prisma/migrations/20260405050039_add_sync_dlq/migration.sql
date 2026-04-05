-- CreateTable
CREATE TABLE "SyncDlq" (
    "id" SERIAL NOT NULL,
    "kopisId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedArtistId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncDlq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncDlq_kopisId_key" ON "SyncDlq"("kopisId");
