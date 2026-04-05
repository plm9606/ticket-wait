import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import authPlugin from "./plugins/auth.js";
import kakaoAuthRoutes from "./routes/auth/kakao.js";
import artistRoutes from "./routes/artists/search.js";
import subscriptionRoutes from "./routes/subscriptions/index.js";
import performanceRoutes from "./routes/performances/index.js";
import notificationRoutes from "./routes/notifications/index.js";
import { env } from "./config/env.js";
import { SpotifyAdapter } from "./adapters/spotify.adapter.js";
import type { ArtistImagePort } from "./ports/artist-image.port.js";

export async function buildApp() {
  const fastify = Fastify({ logger: true });

  // Spotify adapter (env 미설정 시 null → imageUrl fallback)
  const artistImagePort: ArtistImagePort | null =
    env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET
      ? new SpotifyAdapter(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET)
      : null;

  // 플러그인
  await fastify.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });
  await fastify.register(cookie);
  await fastify.register(authPlugin);

  // 라우트
  await fastify.register(kakaoAuthRoutes);
  await fastify.register(artistRoutes, { artistImagePort });
  await fastify.register(subscriptionRoutes);
  await fastify.register(performanceRoutes);
  await fastify.register(notificationRoutes);

  // 헬스체크
  fastify.get("/health", async () => ({ status: "ok" }));

  return fastify;
}
