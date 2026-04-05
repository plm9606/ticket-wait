import type { PrismaClient } from "@prisma/client";
import type { IArtistRepository } from "../../ports/out/artist.port.js";
import type {
  Artist,
  ArtistMatchData,
  ArtistWithPerformances,
  ArtistWithSubscriptionCount,
  CreateArtistInput,
  UpdateArtistInput,
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
        performanceArtists: {
          where: { performance: { status: { in: ["UPCOMING", "ON_SALE"] } } },
          include: { performance: true },
          orderBy: { performance: { startDate: "asc" } },
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
      performances: row.performanceArtists.map((pa) => ({
        id: pa.performance.id,
        title: pa.performance.title,
        startDate: pa.performance.startDate,
        endDate: pa.performance.endDate,
        status: pa.performance.status,
        genre: pa.performance.genre,
        imageUrl: pa.performance.imageUrl,
        source: pa.performance.source,
        sourceUrl: pa.performance.sourceUrl,
        ticketOpenDate: pa.performance.ticketOpenDate,
      })),
    };
  }

  async findAllForMatching(): Promise<ArtistMatchData[]> {
    return this.prisma.artist.findMany({
      select: { id: true, name: true, nameEn: true, aliases: true },
    });
  }

  async findByName(name: string): Promise<Artist | null> {
    const row = await this.prisma.artist.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: "insensitive" } },
          { nameEn: { equals: name, mode: "insensitive" } },
          { aliases: { has: name } },
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
      },
    });

    return row ? toArtist(row) : null;
  }

  async findAllWithoutImage(): Promise<Artist[]> {
    const rows = await this.prisma.artist.findMany({
      where: { imageUrl: null },
      select: {
        id: true,
        name: true,
        nameEn: true,
        aliases: true,
        imageUrl: true,
        musicbrainzId: true,
        appleMusicId: true,
        createdAt: true,
      },
    });

    return rows.map(toArtist);
  }

  async create(data: CreateArtistInput): Promise<Artist> {
    const row = await this.prisma.artist.create({
      data: {
        name: data.name,
        nameEn: data.nameEn ?? null,
        aliases: data.aliases ?? [],
        ...(data.musicbrainzId !== undefined ? { musicbrainzId: data.musicbrainzId } : {}),
        ...(data.appleMusicId !== undefined ? { appleMusicId: data.appleMusicId } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      },
    });

    return toArtist(row);
  }

  async update(id: number, data: UpdateArtistInput): Promise<void> {
    await this.prisma.artist.update({
      where: { id },
      data: {
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.appleMusicId !== undefined ? { appleMusicId: data.appleMusicId } : {}),
        ...(data.aliases !== undefined ? { aliases: data.aliases } : {}),
        ...(data.musicbrainzId !== undefined ? { musicbrainzId: data.musicbrainzId } : {}),
      },
    });
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
