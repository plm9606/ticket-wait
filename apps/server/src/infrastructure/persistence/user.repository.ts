import type { PrismaClient } from "@prisma/client";
import type { IUserRepository } from "../../ports/out/user.port.js";
import type { UpsertUserInput, User, UserWithFcmTokens } from "../../domain/user.entity.js";

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async upsert(data: UpsertUserInput): Promise<User> {
    const row = await this.prisma.user.upsert({
      where: { kakaoId: data.kakaoId },
      update: {
        nickname: data.nickname,
        email: data.email,
        profileImage: data.profileImage,
      },
      create: {
        kakaoId: data.kakaoId,
        nickname: data.nickname,
        email: data.email,
        profileImage: data.profileImage,
      },
    });

    return toUser(row);
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        kakaoId: true,
        nickname: true,
        email: true,
        profileImage: true,
        createdAt: true,
      },
    });

    return row ? toUser(row) : null;
  }

  async findSubscribersByArtist(artistId: number): Promise<UserWithFcmTokens[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { artistId },
      include: {
        user: {
          include: { fcmTokens: { select: { token: true } } },
        },
      },
    });

    return rows.map((s: (typeof rows)[number]) => ({
      ...toUser(s.user),
      fcmTokens: s.user.fcmTokens,
    }));
  }
}

function toUser(row: {
  id: number;
  kakaoId: string;
  nickname: string;
  email: string | null;
  profileImage: string | null;
  createdAt: Date;
}): User {
  return {
    id: row.id,
    kakaoId: row.kakaoId,
    nickname: row.nickname,
    email: row.email,
    profileImage: row.profileImage,
    createdAt: row.createdAt,
  };
}
