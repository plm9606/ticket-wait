import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";

export default async function subscriptionRoutes(fastify: FastifyInstance) {
  // 모든 구독 라우트에 인증 필요
  fastify.addHook("onRequest", fastify.authenticate);

  // 내 구독 목록
  fastify.get("/subscriptions", async (request) => {
    const { userId } = request.user;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            imageUrl: true,
            _count: { select: { performances: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return subscriptions.map((s) => ({
      id: s.id,
      artistId: s.artist.id,
      name: s.artist.name,
      nameEn: s.artist.nameEn,
      imageUrl: s.artist.imageUrl,
      performanceCount: s.artist._count.performances,
      subscribedAt: s.createdAt,
    }));
  });

  // 구독 추가
  fastify.post<{ Body: { artistId: string } }>(
    "/subscriptions",
    async (request, reply) => {
      const { userId } = request.user;
      const { artistId } = request.body;

      if (!artistId) {
        return reply.status(400).send({ error: "artistId is required" });
      }

      // 아티스트 존재 확인
      const artist = await prisma.artist.findUnique({
        where: { id: artistId },
      });
      if (!artist) {
        return reply.status(404).send({ error: "Artist not found" });
      }

      // 이미 구독 중인지 확인
      const existing = await prisma.subscription.findUnique({
        where: { userId_artistId: { userId, artistId } },
      });
      if (existing) {
        return reply.status(409).send({ error: "Already subscribed" });
      }

      const subscription = await prisma.subscription.create({
        data: { userId, artistId },
      });

      return reply.status(201).send({
        id: subscription.id,
        artistId,
        subscribedAt: subscription.createdAt,
      });
    }
  );

  // 구독 해제
  fastify.delete<{ Params: { artistId: string } }>(
    "/subscriptions/:artistId",
    async (request, reply) => {
      const { userId } = request.user;
      const { artistId } = request.params;

      const subscription = await prisma.subscription.findUnique({
        where: { userId_artistId: { userId, artistId } },
      });

      if (!subscription) {
        return reply.status(404).send({ error: "Subscription not found" });
      }

      await prisma.subscription.delete({
        where: { id: subscription.id },
      });

      return { success: true };
    }
  );

  // 구독 여부 확인 (프론트에서 버튼 상태 확인용)
  fastify.get<{ Params: { artistId: string } }>(
    "/subscriptions/check/:artistId",
    async (request) => {
      const { userId } = request.user;
      const { artistId } = request.params;

      const subscription = await prisma.subscription.findUnique({
        where: { userId_artistId: { userId, artistId } },
      });

      return { subscribed: !!subscription };
    }
  );
}
