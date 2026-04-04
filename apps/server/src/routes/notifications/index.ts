import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { notifyNewPerformance } from "../../services/notification.service.js";

export default async function notificationRoutes(fastify: FastifyInstance) {
  // 모든 알림 라우트에 인증 필요
  fastify.addHook("onRequest", fastify.authenticate);

  // FCM 토큰 등록
  fastify.post<{ Body: { token: string; device?: string } }>(
    "/notifications/register-token",
    async (request, reply) => {
      const { userId } = request.user;
      const { token, device } = request.body;

      if (!token) {
        return reply.status(400).send({ error: "token is required" });
      }

      // upsert - 같은 토큰이면 업데이트
      await prisma.fcmToken.upsert({
        where: { token },
        update: { userId, device: device || "web" },
        create: { userId, token, device: device || "web" },
      });

      return { success: true };
    }
  );

  // 알림 내역
  fastify.get<{ Querystring: { limit?: string; cursor?: string } }>(
    "/notifications/history",
    async (request) => {
      const { userId } = request.user;
      const { limit, cursor } = request.query;
      const take = Math.min(Number(limit) || 20, 50);

      const notifications = await prisma.notification.findMany({
        where: { userId },
        include: {
          performance: {
            select: {
              id: true,
              title: true,
              source: true,
              sourceUrl: true,
              imageUrl: true,
              artist: { select: { id: true, name: true, nameEn: true } },
            },
          },
        },
        orderBy: { sentAt: "desc" },
        take: take + 1,
        ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
      });

      const hasMore = notifications.length > take;
      const items = hasMore ? notifications.slice(0, take) : notifications;

      return {
        items: items.map((n) => ({
          id: n.id,
          type: n.type,
          performance: n.performance,
          read: !!n.readAt,
          createdAt: n.sentAt,
        })),
        nextCursor: hasMore ? items[items.length - 1].id : null,
      };
    }
  );

  // 알림 읽음 처리
  fastify.patch<{ Params: { id: string } }>(
    "/notifications/:id/read",
    async (request, reply) => {
      const { userId } = request.user;
      const id = Number(request.params.id);

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        return reply.status(404).send({ error: "Notification not found" });
      }

      await prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });

      return { success: true };
    }
  );

  // 읽지 않은 알림 수
  fastify.get("/notifications/unread-count", async (request) => {
    const { userId } = request.user;

    const count = await prisma.notification.count({
      where: { userId, readAt: null },
    });

    return { count };
  });

  // 테스트 알림 발송 (개발용)
  fastify.post<{ Body: { performanceId: number } }>(
    "/notifications/test-send",
    async (request, reply) => {
      const performanceId = Number(request.body.performanceId);
      if (!performanceId) {
        return reply.status(400).send({ error: "performanceId is required" });
      }

      const sent = await notifyNewPerformance(performanceId);
      return { sent };
    }
  );
}
