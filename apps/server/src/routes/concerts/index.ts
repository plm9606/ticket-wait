import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";

export default async function concertRoutes(fastify: FastifyInstance) {
  // 공연 목록 (최신순, 필터 가능)
  fastify.get<{
    Querystring: {
      source?: string;
      status?: string;
      limit?: string;
      cursor?: string;
    };
  }>("/concerts", async (request) => {
    const { source, status, limit, cursor } = request.query;
    const take = Math.min(Number(limit) || 20, 50);

    const where: Record<string, unknown> = {};
    if (source) where.source = source;
    if (status) where.status = status;

    const concerts = await prisma.concert.findMany({
      where,
      include: {
        artist: { select: { id: true, name: true, nameEn: true } },
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = concerts.length > take;
    const items = hasMore ? concerts.slice(0, take) : concerts;

    return {
      items: items.map((c) => ({
        id: c.id,
        title: c.title,
        artist: c.artist,
        venue: c.venue,
        startDate: c.startDate,
        endDate: c.endDate,
        ticketOpenDate: c.ticketOpenDate,
        source: c.source,
        sourceUrl: c.sourceUrl,
        imageUrl: c.imageUrl,
        status: c.status,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  });

  // 공연 상세
  fastify.get<{ Params: { id: string } }>(
    "/concerts/:id",
    async (request, reply) => {
      const concert = await prisma.concert.findUnique({
        where: { id: request.params.id },
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
        },
      });

      if (!concert) {
        return reply.status(404).send({ error: "Concert not found" });
      }

      return {
        id: concert.id,
        title: concert.title,
        venue: concert.venue,
        startDate: concert.startDate,
        endDate: concert.endDate,
        ticketOpenDate: concert.ticketOpenDate,
        source: concert.source,
        sourceUrl: concert.sourceUrl,
        imageUrl: concert.imageUrl,
        status: concert.status,
        artist: concert.artist
          ? {
              id: concert.artist.id,
              name: concert.artist.name,
              nameEn: concert.artist.nameEn,
              imageUrl: concert.artist.imageUrl,
              aliases: concert.artist.aliases,
              subscriberCount: concert.artist._count.subscriptions,
            }
          : null,
      };
    }
  );

  // 아티스트별 공연 목록
  fastify.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/artists/:id/concerts",
    async (request, reply) => {
      const { id } = request.params;
      const take = Math.min(Number(request.query.limit) || 20, 50);

      const artist = await prisma.artist.findUnique({ where: { id } });
      if (!artist) {
        return reply.status(404).send({ error: "Artist not found" });
      }

      const concerts = await prisma.concert.findMany({
        where: { artistId: id },
        orderBy: { startDate: "desc" },
        take,
      });

      return concerts;
    }
  );

  // 내 구독 아티스트의 공연 (피드)
  fastify.get<{ Querystring: { limit?: string; cursor?: string } }>(
    "/concerts/feed",
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

      const concerts = await prisma.concert.findMany({
        where: { artistId: { in: artistIds } },
        include: {
          artist: { select: { id: true, name: true, nameEn: true } },
        },
        orderBy: { createdAt: "desc" },
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      const hasMore = concerts.length > take;
      const items = hasMore ? concerts.slice(0, take) : concerts;

      return {
        items: items.map((c) => ({
          id: c.id,
          title: c.title,
          artist: c.artist,
          venue: c.venue,
          startDate: c.startDate,
          endDate: c.endDate,
          ticketOpenDate: c.ticketOpenDate,
          source: c.source,
          sourceUrl: c.sourceUrl,
          imageUrl: c.imageUrl,
          status: c.status,
        })),
        nextCursor: hasMore ? items[items.length - 1].id : null,
      };
    }
  );
}
