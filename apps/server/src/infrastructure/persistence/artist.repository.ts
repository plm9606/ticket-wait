import type { PrismaClient } from "@prisma/client";
import type { IArtistRepository } from "../../ports/out/artist.port.js";
import type {
  Artist,
  ArtistMatchData,
  ArtistWithPerformances,
  ArtistWithSubscriptionCount,
  CreateArtistInput,
} from "../../domain/artist.entity.js";

export class PrismaArtistRepository implements IArtistRepository {
  constructor(private prisma: PrismaClient) {}

  async search(query: string, limit: number): Promise<ArtistWithSubscriptionCount[]> {
    const rows = await this.prisma.artist.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { nameEn: { contains: query, mode: "insensitive" } },
          { aliases: { has: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        aliases: true,
        imageUrl: true,
        musicbrainzId: true,
        appleMusicId: true,
        createdAt: true,
        _count: { select: { subscriptions: true } },
      },
      orderBy: { subscriptions: { _count: "desc" } },
      take: limit,
    });

    return rows.map(toArtistWithSubscriptionCount);
  }

  async findAll(limit: number): Promise<ArtistWithSubscriptionCount[]> {
    const rows = await this.prisma.artist.findMany({
      select: {
        id: true,
        name: true,
        nameEn: true,
        aliases: true,
        imageUrl: true,
        musicbrainzId: true,
        appleMusicId: true,
        createdAt: true,
        _count: { select: { subscriptions: true } },
      },
      orderBy: { subscriptions: { _count: "desc" } },
      take: limit,
    });

    return rows.map(toArtistWithSubscriptionCount);
  }

  async findById(id: number): Promise<ArtistWithPerformances | null> {
    const row = await this.prisma.artist.findUnique({
      where: { id },
      include: {
        _count: { select: { subscriptions: true } },
        performances: {
          where: { status: { in: ["UPCOMING", "ON_SALE"] } },
          orderBy: { startDate: "asc" },
          take: 20,
        },
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      nameEn: row.nameEn,
      aliases: row.aliases,
      imageUrl: row.imageUrl,
      musicbrainzId: row.musicbrainzId,
      appleMusicId: row.appleMusicId,
      createdAt: row.createdAt,
      subscriberCount: row._count.subscriptions,
      performances: row.performances.map((p) => ({
        id: p.id,
        title: p.title,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        genre: p.genre,
        imageUrl: p.imageUrl,
        source: p.source,
        sourceUrl: p.sourceUrl,
        ticketOpenDate: p.ticketOpenDate,
      })),
    };
  }

  async findAllForMatching(): Promise<ArtistMatchData[]> {
    return this.prisma.artist.findMany({
      select: { id: true, name: true, nameEn: true, aliases: true },
    });
  }

  async create(data: CreateArtistInput): Promise<Artist> {
    const row = await this.prisma.artist.create({
      data: {
        name: data.name,
        nameEn: data.nameEn ?? null,
        aliases: data.aliases ?? [],
      },
    });

    return toArtist(row);
  }
}

function toArtist(row: {
  id: number;
  name: string;
  nameEn: string | null;
  aliases: string[];
  imageUrl: string | null;
  musicbrainzId: string | null;
  appleMusicId: number | null;
  createdAt: Date;
}): Artist {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.nameEn,
    aliases: row.aliases,
    imageUrl: row.imageUrl,
    musicbrainzId: row.musicbrainzId,
    appleMusicId: row.appleMusicId,
    createdAt: row.createdAt,
  };
}

function toArtistWithSubscriptionCount(row: {
  id: number;
  name: string;
  nameEn: string | null;
  aliases: string[];
  imageUrl: string | null;
  musicbrainzId: string | null;
  appleMusicId: number | null;
  createdAt: Date;
  _count: { subscriptions: number };
}): ArtistWithSubscriptionCount {
  return {
    ...toArtist(row),
    subscriberCount: row._count.subscriptions,
  };
}
