import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";

export default async function performanceRoutes(fastify: FastifyInstance) {
  // 공연 목록 (최신순, 필터 가능)
  fastify.get<{
    Querystring: {
      source?: string;
      status?: string;
      genre?: string;
      limit?: string;
      cursor?: string;
    };
  }>("/performances", async (request) => {
    const { source, status, genre, limit, cursor } = request.query;
    const take = Math.min(Number(limit) || 20, 50);

    const where: Record<string, unknown> = {};
    if (source) where.source = source;
    if (status) where.status = status;
    if (genre) where.genre = genre;

    const performances = await prisma.performance.findMany({
      where,
      include: {
        artist: { select: { id: true, name: true, nameEn: true } },
        venue: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
    });

    const hasMore = performances.length > take;
    const items = hasMore ? performances.slice(0, take) : performances;

    return {
      items: items.map((p) => ({
        id: p.id,
        title: p.title,
        artist: p.artist,
        venue: p.venue,
        startDate: p.startDate,
        endDate: p.endDate,
        ticketOpenDate: p.ticketOpenDate,
        source: p.source,
        sourceUrl: p.sourceUrl,
        imageUrl: p.imageUrl,
        genre: p.genre,
        status: p.status,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  });

  // 공연 상세
  fastify.get<{ Params: { id: string } }>(
    "/performances/:id",
    async (request, reply) => {
      const performance = await prisma.performance.findUnique({
        where: { id: Number(request.params.id) },
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              imageUrl: true,
              aliases: true,
              _count: { select: { subscriptions: true } },
            },
          },
          venue: true,
        },
      });

      if (!performance) {
        return reply.status(404).send({ error: "Performance not found" });
      }

      return {
        id: performance.id,
        title: performance.title,
        venue: performance.venue,
        startDate: performance.startDate,
        endDate: performance.endDate,
        ticketOpenDate: performance.ticketOpenDate,
        source: performance.source,
        sourceUrl: performance.sourceUrl,
        imageUrl: performance.imageUrl,
        genre: performance.genre,
        status: performance.status,
        artist: performance.artist
          ? {
              id: performance.artist.id,
              name: performance.artist.name,
              nameEn: performance.artist.nameEn,
              imageUrl: performance.artist.imageUrl,
              aliases: performance.artist.aliases,
              subscriberCount: performance.artist._count.subscriptions,
            }
          : null,
      };
    }
  );

  // 아티스트별 공연 목록
  fastify.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/artists/:id/performances",
    async (request, reply) => {
      const id = Number(request.params.id);
      const take = Math.min(Number(request.query.limit) || 20, 50);

      const artist = await prisma.artist.findUnique({ where: { id } });
      if (!artist) {
        return reply.status(404).send({ error: "Artist not found" });
      }

      const performances = await prisma.performance.findMany({
        where: { artistId: id },
        orderBy: { startDate: "desc" },
        take,
      });

      return performances;
    }
  );

  // 내 구독 아티스트의 공연 (피드)
  fastify.get<{ Querystring: { limit?: string; cursor?: string } }>(
    "/performances/feed",
    { onRequest: [fastify.authenticate] },
    async (request) => {
      const { userId } = request.user;
      const { limit, cursor } = request.query;
      const take = Math.min(Number(limit) || 20, 50);

      // 구독 아티스트 ID 조회
      const subscriptions = await prisma.subscription.findMany({
        where: { userId },
        select: { artistId: true },
      });
      const artistIds = subscriptions.map((s) => s.artistId);

      if (artistIds.length === 0) {
        return { items: [], nextCursor: null };
      }

      const performances = await prisma.performance.findMany({
        where: { artistId: { in: artistIds } },
        include: {
          artist: { select: { id: true, name: true, nameEn: true } },
          venue: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: take + 1,
        ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
      });

      const hasMore = performances.length > take;
      const items = hasMore ? performances.slice(0, take) : performances;

      return {
        items: items.map((p) => ({
          id: p.id,
          title: p.title,
          artist: p.artist,
          venue: p.venue,
          startDate: p.startDate,
          endDate: p.endDate,
          ticketOpenDate: p.ticketOpenDate,
          source: p.source,
          sourceUrl: p.sourceUrl,
          imageUrl: p.imageUrl,
          status: p.status,
        })),
        nextCursor: hasMore ? items[items.length - 1].id : null,
      };
    }
  );
}
