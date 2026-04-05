import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";

export default async function artistRoutes(fastify: FastifyInstance) {
  // 아티스트 검색
  fastify.get<{ Querystring: { q?: string; limit?: string } }>(
    "/artists/search",
    async (request) => {
      const { q, limit } = request.query;
      const take = Math.min(Number(limit) || 20, 50);

      if (!q || !q.trim()) {
        return [];
      }

      const query = q.trim();

      const artists = await prisma.artist.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { nameEn: { contains: query, mode: "insensitive" } },
            { aliases: { has: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          nameEn: true,
          imageUrl: true,
          _count: { select: { subscriptions: true } },
        },
        orderBy: { subscriptions: { _count: "desc" } },
        take,
      });

      return artists.map((a) => ({
        id: a.id,
        name: a.name,
        nameEn: a.nameEn,
        imageUrl: a.imageUrl,
        subscriberCount: a._count.subscriptions,
      }));
    }
  );

  // 인기 아티스트 목록
  fastify.get<{ Querystring: { limit?: string } }>(
    "/artists",
    async (request) => {
      const take = Math.min(Number(request.query.limit) || 30, 50);

      const artists = await prisma.artist.findMany({
        select: {
          id: true,
          name: true,
          nameEn: true,
          imageUrl: true,
          _count: { select: { subscriptions: true } },
        },
        orderBy: { subscriptions: { _count: "desc" } },
        take,
      });

      return artists.map((a) => ({
        id: a.id,
        name: a.name,
        nameEn: a.nameEn,
        imageUrl: a.imageUrl,
        subscriberCount: a._count.subscriptions,
      }));
    }
  );

  // 아티스트 상세
  fastify.get<{ Params: { id: string } }>(
    "/artists/:id",
    async (request, reply) => {
      const artist = await prisma.artist.findUnique({
        where: { id: Number(request.params.id) },
        include: {
          _count: { select: { subscriptions: true } },
          performances: {
            where: { status: { in: ["UPCOMING", "ON_SALE"] } },
            orderBy: { startDate: "asc" },
            take: 20,
          },
        },
      });

      if (!artist) {
        return reply.status(404).send({ error: "Artist not found" });
      }

      return {
        id: artist.id,
        name: artist.name,
        nameEn: artist.nameEn,
        aliases: artist.aliases,
        imageUrl: artist.imageUrl,
        subscriberCount: artist._count.subscriptions,
        performances: artist.performances,
      };
    }
  );
}
