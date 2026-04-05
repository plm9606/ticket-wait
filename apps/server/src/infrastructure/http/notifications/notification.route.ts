import type { FastifyInstance } from "fastify";
import type { INotificationUseCase } from "../../../ports/in/notification.use-case.js";

export async function notificationRoutes(
  fastify: FastifyInstance,
  { notificationService }: { notificationService: INotificationUseCase }
) {
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.post<{ Body: { token: string; device?: string } }>(
    "/notifications/register-token",
    async (request, reply) => {
      const { userId } = request.user;
      const { token, device } = request.body;

      if (!token) {
        return reply.status(400).send({ error: "token is required" });
      }

      await notificationService.registerToken(userId, token, device);
      return { success: true };
    }
  );

  fastify.get<{ Querystring: { limit?: string; cursor?: string } }>(
    "/notifications/history",
    async (request) => {
      const { userId } = request.user;
      const { limit, cursor } = request.query;
      return notificationService.history(
        userId,
        Number(limit) || 20,
        cursor ? Number(cursor) : undefined
      );
    }
  );

  fastify.patch<{ Params: { id: string } }>(
    "/notifications/:id/read",
    async (request, reply) => {
      const { userId } = request.user;
      const id = Number(request.params.id);

      try {
        await notificationService.markRead(id, userId);
        return { success: true };
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        if (e.statusCode === 404) return reply.status(404).send({ error: e.message });
        throw err;
      }
    }
  );

  fastify.get("/notifications/unread-count", async (request) => {
    const { userId } = request.user;
    const count = await notificationService.unreadCount(userId);
    return { count };
  });

  fastify.post<{ Body: { performanceId: number } }>(
    "/notifications/test-send",
    async (request, reply) => {
      const performanceId = Number(request.body.performanceId);
      if (!performanceId) {
        return reply.status(400).send({ error: "performanceId is required" });
      }

      const sent = await notificationService.notifyNewPerformance(performanceId);
      return { sent };
    }
  );
}
