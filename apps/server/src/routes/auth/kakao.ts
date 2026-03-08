import type { FastifyInstance } from "fastify";
import { getAuthorizationUrl, exchangeCode, getUserProfile } from "../../lib/kakao.js";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";

export default async function kakaoAuthRoutes(fastify: FastifyInstance) {
  // 카카오 로그인 리다이렉트
  fastify.get("/auth/kakao", async (_request, reply) => {
    reply.redirect(getAuthorizationUrl());
  });

  // 카카오 OAuth 콜백
  fastify.get<{ Querystring: { code: string } }>(
    "/auth/kakao/callback",
    async (request, reply) => {
      const { code } = request.query;

      if (!code) {
        return reply.status(400).send({ error: "Missing authorization code" });
      }

      const tokenData = await exchangeCode(code);
      const profile = await getUserProfile(tokenData.access_token);

      // 유저 upsert
      const user = await prisma.user.upsert({
        where: { kakaoId: profile.kakaoId },
        update: {
          nickname: profile.nickname,
          email: profile.email,
          profileImage: profile.profileImage,
        },
        create: {
          kakaoId: profile.kakaoId,
          nickname: profile.nickname,
          email: profile.email,
          profileImage: profile.profileImage,
        },
      });

      // JWT 발급
      const token = fastify.jwt.sign({ userId: user.id });

      reply
        .setCookie("token", token, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30, // 30일
        })
        .redirect(`${env.FRONTEND_URL}/my`);
    }
  );

  // 로그아웃
  fastify.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie("token", { path: "/" }).send({ ok: true });
  });

  // 현재 유저 정보
  fastify.get(
    "/auth/me",
    { onRequest: [fastify.authenticate] },
    async (request) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          id: true,
          nickname: true,
          email: true,
          profileImage: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw { statusCode: 404, message: "User not found" };
      }

      return user;
    }
  );
}
