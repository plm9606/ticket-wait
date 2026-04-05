import type { FastifyInstance } from "fastify";
import type { IArtistUseCase } from "../../../ports/in/artist.use-case.js";

export async function artistRoutes(
  fastify: FastifyInstance,
  { artistService }: { artistService: IArtistUseCase }
) {
  fastify.get<{ Querystring: { q?: string; limit?: string } }>(
    "/artists/search",
    async (request) => {
      const { q, limit } = request.query;
      return artistService.search(q ?? "", Number(limit) || 20);
    }
  );

  fastify.get<{ Querystring: { limit?: string } }>(
    "/artists",
    async (request) => {
      return artistService.list(Number(request.query.limit) || 30);
    }
  );

  fastify.get<{ Params: { id: string } }>(
    "/artists/:id",
    async (request, reply) => {
      try {
        return await artistService.findById(Number(request.params.id));
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        if (e.statusCode === 404) return reply.status(404).send({ error: e.message });
        throw err;
      }
    }
  );
}
