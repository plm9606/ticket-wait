import type { FastifyInstance } from "fastify";
import type { IKakaoAuthPort } from "../../../ports/out/kakao-auth.port.js";
import type { IUserRepository } from "../../../ports/out/user.port.js";
import { env } from "../../../config/env.js";

export async function kakaoAuthRoutes(
  fastify: FastifyInstance,
  { userRepository, kakaoAuth }: { userRepository: IUserRepository; kakaoAuth: IKakaoAuthPort }
) {
  fastify.get("/auth/kakao", async (_request, reply) => {
    reply.redirect(kakaoAuth.getAuthorizationUrl());
  });

  fastify.get<{ Querystring: { code: string } }>(
    "/auth/kakao/callback",
    async (request, reply) => {
      const { code } = request.query;

      if (!code) {
        return reply.status(400).send({ error: "Missing authorization code" });
      }

      const tokenData = await kakaoAuth.exchangeCode(code);
      const profile = await kakaoAuth.getUserProfile(tokenData.access_token);
      const user = await userRepository.upsert(profile);

      const token = fastify.jwt.sign({ userId: user.id });

      reply
        .setCookie("token", token, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30,
        })
        .redirect(`${env.FRONTEND_URL}/my`);
    }
  );

  fastify.get("/auth/kakao/mobile", async (_request, reply) => {
    reply.redirect(kakaoAuth.getAuthorizationUrl(env.KAKAO_REDIRECT_URI_MOBILE));
  });

  fastify.get<{ Querystring: { code: string } }>(
    "/auth/kakao/callback/mobile",
    async (request, reply) => {
      const { code } = request.query;

      if (!code) {
        return reply.status(400).send({ error: "Missing authorization code" });
      }

      const tokenData = await kakaoAuth.exchangeCode(code, env.KAKAO_REDIRECT_URI_MOBILE);
      const profile = await kakaoAuth.getUserProfile(tokenData.access_token);
      const user = await userRepository.upsert(profile);

      const token = fastify.jwt.sign({ userId: user.id });
      reply.redirect(`concertalert://auth/callback?token=${token}`);
    }
  );

  fastify.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie("token", { path: "/" }).send({ ok: true });
  });

  fastify.get(
    "/auth/me",
    { onRequest: [fastify.authenticate] },
    async (request) => {
      const user = await userRepository.findById(request.user.userId);
      if (!user) {
        throw { statusCode: 404, message: "User not found" };
      }
      return user;
    }
  );
}
