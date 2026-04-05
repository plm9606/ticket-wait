import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import authPlugin from "./plugins/auth.js";
import { env } from "./config/env.js";

// Infrastructure — Persistence
import { prisma } from "./infrastructure/persistence/prisma.js";
import { PrismaArtistRepository } from "./infrastructure/persistence/artist.repository.js";
import { PrismaPerformanceRepository } from "./infrastructure/persistence/performance.repository.js";
import { PrismaSubscriptionRepository } from "./infrastructure/persistence/subscription.repository.js";
import { PrismaNotificationRepository } from "./infrastructure/persistence/notification.repository.js";
import { PrismaUserRepository } from "./infrastructure/persistence/user.repository.js";
import { PrismaVenueRepository } from "./infrastructure/persistence/venue.repository.js";
import { PrismaSyncLogRepository } from "./infrastructure/persistence/sync-log.repository.js";
import { PrismaSyncDlqRepository } from "./infrastructure/persistence/sync-dlq.repository.js";

// Infrastructure — External
import { FcmAdapter } from "./infrastructure/external/fcm.adapter.js";
import { KopisAdapter } from "./infrastructure/external/kopis.adapter.js";
import { KakaoAdapter } from "./infrastructure/external/kakao.adapter.js";
import { MusicBrainzAdapter } from "./infrastructure/external/musicbrainz.adapter.js";
import { AppleMusicAdapter } from "./infrastructure/external/apple-music.adapter.js";
import { WikidataAdapter } from "./infrastructure/external/wikidata.adapter.js";
import { ImageEnrichmentAdapter } from "./infrastructure/external/image-enrichment.adapter.js";

// Application Services
import { ArtistService } from "./application/artist/artist.service.js";
import { CreateArtistService } from "./application/artist/create-artist.service.js";
import { EnrichArtistService } from "./application/artist/enrich-artist.service.js";
import { PerformanceService } from "./application/performance/performance.service.js";
import { SubscriptionService } from "./application/subscription/subscription.service.js";
import { NotificationService } from "./application/notification/notification.service.js";
import { KopisSyncService } from "./application/sync/kopis-sync.service.js";

// Infrastructure — HTTP Routes
import { kakaoAuthRoutes } from "./infrastructure/http/auth/kakao.route.js";
import { artistRoutes } from "./infrastructure/http/artists/artist.route.js";
import { subscriptionRoutes } from "./infrastructure/http/subscriptions/subscription.route.js";
import { performanceRoutes } from "./infrastructure/http/performances/performance.route.js";
import { notificationRoutes } from "./infrastructure/http/notifications/notification.route.js";

export async function buildApp() {
  const fastify = Fastify({ logger: true });

  // ─── Plugins ──────────────────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });
  await fastify.register(cookie);
  await fastify.register(authPlugin);

  // ─── Dependency Assembly ──────────────────────────────────────────────────

  // Repositories
  const artistRepo = new PrismaArtistRepository(prisma);
  const performanceRepo = new PrismaPerformanceRepository(prisma);
  const subscriptionRepo = new PrismaSubscriptionRepository(prisma);
  const notificationRepo = new PrismaNotificationRepository(prisma);
  const userRepo = new PrismaUserRepository(prisma);
  const venueRepo = new PrismaVenueRepository(prisma);
  const syncLogRepo = new PrismaSyncLogRepository(prisma);
  const syncDlqRepo = new PrismaSyncDlqRepository(prisma);

  // External adapters (leaf dependencies first)
  const fcm = new FcmAdapter();
  const kopis = new KopisAdapter();
  const kakaoAuth = new KakaoAdapter();
  const musicbrainz = new MusicBrainzAdapter();
  const appleMusic = new AppleMusicAdapter();
  const wikidata = new WikidataAdapter(musicbrainz);
  const imageEnrichment = new ImageEnrichmentAdapter(appleMusic, wikidata);

  // Application services
  const artistService = new ArtistService(artistRepo);
  const createArtistService = new CreateArtistService(artistRepo, imageEnrichment, musicbrainz);
  const enrichArtistService = new EnrichArtistService(artistRepo, imageEnrichment);
  const subscriptionService = new SubscriptionService(subscriptionRepo, artistRepo);
  const notificationService = new NotificationService(notificationRepo, userRepo, performanceRepo, fcm);
  const performanceService = new PerformanceService(performanceRepo, subscriptionRepo);
  const syncService = new KopisSyncService(kopis, artistRepo, performanceRepo, venueRepo, syncLogRepo, syncDlqRepo, notificationService, createArtistService);

  // ─── Routes ───────────────────────────────────────────────────────────────
  await fastify.register(kakaoAuthRoutes, { userRepository: userRepo, kakaoAuth });
  await fastify.register(artistRoutes, { artistService });
  await fastify.register(subscriptionRoutes, { subscriptionService });
  await fastify.register(performanceRoutes, { performanceService, artistService });
  await fastify.register(notificationRoutes, { notificationService });

  // ─── Health Check ─────────────────────────────────────────────────────────
  fastify.get("/health", async () => ({ status: "ok" }));

  return { fastify, syncService, notificationService };
}
