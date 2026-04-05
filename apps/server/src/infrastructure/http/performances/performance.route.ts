import type { FastifyInstance } from "fastify";
import type { IPerformanceUseCase } from "../../../ports/in/performance.use-case.js";
import type { IArtistUseCase } from "../../../ports/in/artist.use-case.js";

export async function performanceRoutes(
  fastify: FastifyInstance,
  {
    performanceService,
    artistService,
  }: { performanceService: IPerformanceUseCase; artistService: IArtistUseCase }
) {
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
    return performanceService.list(
      {
        source: source as never,
        status: status as never,
        genre: genre as never,
      },
      Number(limit) || 20,
      cursor ? Number(cursor) : undefined
    );
  });

  fastify.get<{ Params: { id: string } }>(
    "/performances/:id",
    async (request, reply) => {
      try {
        return await performanceService.findById(Number(request.params.id));
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        if (e.statusCode === 404) return reply.status(404).send({ error: e.message });
        throw err;
      }
    }
  );

  fastify.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/artists/:id/performances",
    async (request, reply) => {
      try {
        await artistService.findById(Number(request.params.id));
      } catch {
        return reply.status(404).send({ error: "Artist not found" });
      }
      return performanceService.findByArtist(
        Number(request.params.id),
        Number(request.query.limit) || 20
      );
    }
  );

  fastify.get<{ Querystring: { limit?: string; cursor?: string } }>(
    "/performances/feed",
    { onRequest: [fastify.authenticate] },
    async (request) => {
      const { userId } = request.user;
      const { limit, cursor } = request.query;
      return performanceService.feed(
        userId,
        Number(limit) || 20,
        cursor ? Number(cursor) : undefined
      );
    }
  );
}
