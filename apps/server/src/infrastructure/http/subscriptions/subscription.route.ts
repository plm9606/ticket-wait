import type { FastifyInstance } from "fastify";
import type { ISubscriptionUseCase } from "../../../ports/in/subscription.use-case.js";

export async function subscriptionRoutes(
  fastify: FastifyInstance,
  { subscriptionService }: { subscriptionService: ISubscriptionUseCase }
) {
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/subscriptions", async (request) => {
    const { userId } = request.user;
    return subscriptionService.list(userId);
  });

  fastify.post<{ Body: { artistId: number } }>(
    "/subscriptions",
    async (request, reply) => {
      const { userId } = request.user;
      const artistId = Number(request.body.artistId);

      if (!artistId) {
        return reply.status(400).send({ error: "artistId is required" });
      }

      try {
        const subscription = await subscriptionService.create(userId, artistId);
        return reply.status(201).send({
          id: subscription.id,
          artistId,
          subscribedAt: subscription.createdAt,
        });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        if (e.statusCode === 404) return reply.status(404).send({ error: e.message });
        if (e.statusCode === 409) return reply.status(409).send({ error: e.message });
        throw err;
      }
    }
  );

  fastify.delete<{ Params: { artistId: string } }>(
    "/subscriptions/:artistId",
    async (request, reply) => {
      const { userId } = request.user;
      const artistId = Number(request.params.artistId);

      try {
        await subscriptionService.remove(userId, artistId);
        return { success: true };
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        if (e.statusCode === 404) return reply.status(404).send({ error: e.message });
        throw err;
      }
    }
  );

  fastify.get<{ Params: { artistId: string } }>(
    "/subscriptions/check/:artistId",
    async (request) => {
      const { userId } = request.user;
      const artistId = Number(request.params.artistId);
      const subscribed = await subscriptionService.check(userId, artistId);
      return { subscribed };
    }
  );
}
