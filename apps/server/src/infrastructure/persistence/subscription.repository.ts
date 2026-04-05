import type { PrismaClient } from "@prisma/client";
import type { ISubscriptionRepository } from "../../ports/out/subscription.port.js";
import type { Subscription, SubscriptionWithArtist } from "../../domain/subscription.entity.js";

export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  constructor(private prisma: PrismaClient) {}

  async findByUser(userId: number): Promise<SubscriptionWithArtist[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { userId },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            imageUrl: true,
            _count: { select: { performanceArtists: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((s) => ({
      id: s.id,
      artistId: s.artist.id,
      name: s.artist.name,
      nameEn: s.artist.nameEn,
      imageUrl: s.artist.imageUrl,
      performanceCount: s.artist._count.performanceArtists,
      subscribedAt: s.createdAt,
    }));
  }

  async findArtistIds(userId: number): Promise<number[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { userId },
      select: { artistId: true },
    });

    return rows.map((s) => s.artistId);
  }

  async find(userId: number, artistId: number): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });

    return row ? toSubscription(row) : null;
  }

  async create(userId: number, artistId: number): Promise<Subscription> {
    const row = await this.prisma.subscription.create({
      data: { userId, artistId },
    });

    return toSubscription(row);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.subscription.delete({ where: { id } });
  }
}

function toSubscription(row: {
  id: number;
  userId: number;
  artistId: number;
  createdAt: Date;
}): Subscription {
  return {
    id: row.id,
    userId: row.userId,
    artistId: row.artistId,
    createdAt: row.createdAt,
  };
}
