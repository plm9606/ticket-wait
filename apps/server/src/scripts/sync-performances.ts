import { prisma } from "../infrastructure/persistence/prisma.js";
import { PrismaArtistRepository } from "../infrastructure/persistence/artist.repository.js";
import { PrismaPerformanceRepository } from "../infrastructure/persistence/performance.repository.js";
import { PrismaNotificationRepository } from "../infrastructure/persistence/notification.repository.js";
import { PrismaUserRepository } from "../infrastructure/persistence/user.repository.js";
import { PrismaVenueRepository } from "../infrastructure/persistence/venue.repository.js";
import { PrismaSyncLogRepository } from "../infrastructure/persistence/sync-log.repository.js";
import { PrismaSyncDlqRepository } from "../infrastructure/persistence/sync-dlq.repository.js";
import { FcmAdapter } from "../infrastructure/external/fcm.adapter.js";
import { ImageEnrichmentAdapter } from "../infrastructure/external/image-enrichment.adapter.js";
import { NotificationService } from "../application/notification/notification.service.js";
import { EnrichArtistService } from "../application/artist/enrich-artist.service.js";
import { KopisSyncService } from "../application/sync/kopis-sync.service.js";

async function main() {
  const artistRepo = new PrismaArtistRepository(prisma);
  const performanceRepo = new PrismaPerformanceRepository(prisma);
  const notificationRepo = new PrismaNotificationRepository(prisma);
  const userRepo = new PrismaUserRepository(prisma);
  const venueRepo = new PrismaVenueRepository(prisma);
  const syncLogRepo = new PrismaSyncLogRepository(prisma);
  const syncDlqRepo = new PrismaSyncDlqRepository(prisma);

  const fcm = new FcmAdapter();
  const imageEnrichment = new ImageEnrichmentAdapter();
  const notificationService = new NotificationService(notificationRepo, userRepo, performanceRepo, fcm);
  const enrichArtistService = new EnrichArtistService(artistRepo, imageEnrichment);
  const syncService = new KopisSyncService(artistRepo, performanceRepo, venueRepo, syncLogRepo, syncDlqRepo, notificationService, enrichArtistService);

  console.log("공연 동기화 시작...");
  await syncService.syncPerformances();
  console.log("공연 동기화 완료");
}

main()
  .catch((e) => {
    console.error("동기화 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
