import type { PrismaClient } from "@prisma/client";
import type { IPerformanceRepository } from "../../ports/out/performance.port.js";
import type {
  CursorPage,
  Performance,
  PerformanceDetail,
  PerformanceFilters,
  PerformanceListItem,
  UpsertPerformanceInput,
} from "../../domain/performance.entity.js";

const artistSelect = { id: true, name: true, nameEn: true } as const;
const artistDetailSelect = {
  id: true,
  name: true,
  nameEn: true,
  imageUrl: true,
  aliases: true,
  _count: { select: { subscriptions: true } },
} as const;

export class PrismaPerformanceRepository implements IPerformanceRepository {
  constructor(private prisma: PrismaClient) {}

  async findMany(
    filters: PerformanceFilters,
    limit: number,
    cursor?: number
  ): Promise<CursorPage<PerformanceListItem>> {
    const where: Record<string, unknown> = {};
    if (filters.source) where.source = filters.source;
    if (filters.status) where.status = filters.status;
    if (filters.genre) where.genre = filters.genre;

    const rows = await this.prisma.performance.findMany({
      where,
      include: {
        performanceArtists: { include: { artist: { select: artistSelect } } },
        venue: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return buildCursorPage(rows, limit, toListItem);
  }

  async findById(id: number): Promise<PerformanceDetail | null> {
    const row = await this.prisma.performance.findUnique({
      where: { id },
      include: {
        performanceArtists: {
          include: { artist: { select: artistDetailSelect } },
        },
        venue: true,
      },
    });

    if (!row) return null;

    return {
      ...toPerformance(row),
      artists: row.performanceArtists.map((pa: (typeof row.performanceArtists)[number]) => ({
        id: pa.artist.id,
        name: pa.artist.name,
        nameEn: pa.artist.nameEn,
        imageUrl: pa.artist.imageUrl,
        aliases: pa.artist.aliases,
        subscriberCount: pa.artist._count.subscriptions,
      })),
      venue: row.venue
        ? {
            id: row.venue.id,
            name: row.venue.name,
            address: row.venue.address,
            lat: row.venue.lat,
            lng: row.venue.lng,
            sido: row.venue.sido,
            gugun: row.venue.gugun,
          }
        : null,
    };
  }

  async findByArtist(artistId: number, limit: number): Promise<Performance[]> {
    const rows = await this.prisma.performance.findMany({
      where: { performanceArtists: { some: { artistId } } },
      orderBy: { startDate: "desc" },
      take: limit,
    });

    return rows.map(toPerformance);
  }

  async findFeed(
    artistIds: number[],
    limit: number,
    cursor?: number
  ): Promise<CursorPage<PerformanceListItem>> {
    const rows = await this.prisma.performance.findMany({
      where: { performanceArtists: { some: { artistId: { in: artistIds } } } },
      include: {
        performanceArtists: { include: { artist: { select: artistSelect } } },
        venue: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return buildCursorPage(rows, limit, toListItem);
  }

  async upsert(data: UpsertPerformanceInput): Promise<{ performance: Performance; isNew: boolean }> {
    const existing = await this.prisma.performance.findFirst({
      where: { kopisId: data.kopisId, source: data.source },
    });

    if (existing) {
      const updated = await this.prisma.performance.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          startDate: data.startDate,
          endDate: data.endDate,
          venueId: data.venueId,
          imageUrl: data.imageUrl,
          sourceUrl: data.sourceUrl,
          genre: data.genre,
          status: data.status,
        },
      });
      if (data.artistIds.length > 0) {
        await this.syncArtists(existing.id, data.artistIds);
      }
      return { performance: toPerformance(updated), isNew: false };
    }

    const created = await this.prisma.performance.create({
      data: {
        title: data.title,
        rawTitle: data.rawTitle,
        kopisId: data.kopisId,
        source: data.source,
        sourceId: data.sourceId,
        sourceUrl: data.sourceUrl,
        venueId: data.venueId,
        startDate: data.startDate,
        endDate: data.endDate,
        imageUrl: data.imageUrl,
        genre: data.genre,
        status: data.status,
      },
    });

    if (data.artistIds.length > 0) {
      await this.prisma.performanceArtist.createMany({
        data: data.artistIds.map((artistId) => ({ performanceId: created.id, artistId })),
        skipDuplicates: true,
      });
    }

    return { performance: toPerformance(created), isNew: true };
  }

  async findUnmatched(): Promise<Array<{ id: number; title: string }>> {
    return this.prisma.performance.findMany({
      where: { performanceArtists: { none: {} } },
      select: { id: true, title: true },
    });
  }

  async setArtists(id: number, artistIds: number[]): Promise<void> {
    await this.syncArtists(id, artistIds);
  }

  async findWithTicketOpenToday(): Promise<
    Array<{
      id: number;
      title: string;
      artistIds: number[];
      artists: Array<{ id: number; name: string }>;
      imageUrl: string | null;
      sourceUrl: string;
    }>
  > {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rows = await this.prisma.performance.findMany({
      where: {
        ticketOpenDate: { gte: today, lt: tomorrow },
        performanceArtists: { some: {} },
      },
      include: {
        performanceArtists: {
          include: { artist: { select: { id: true, name: true } } },
        },
      },
    });

    return rows.map((r: (typeof rows)[number]) => ({
      id: r.id,
      title: r.title,
      artistIds: r.performanceArtists.map((pa: (typeof r.performanceArtists)[number]) => pa.artistId),
      artists: r.performanceArtists.map((pa: (typeof r.performanceArtists)[number]) => pa.artist),
      imageUrl: r.imageUrl,
      sourceUrl: r.sourceUrl,
    }));
  }

  private async syncArtists(performanceId: number, artistIds: number[]): Promise<void> {
    await this.prisma.performanceArtist.deleteMany({ where: { performanceId } });
    if (artistIds.length > 0) {
      await this.prisma.performanceArtist.createMany({
        data: artistIds.map((artistId) => ({ performanceId, artistId })),
        skipDuplicates: true,
      });
    }
  }
}

function toPerformance(row: {
  id: number;
  title: string;
  rawTitle: string;
  kopisId: string | null;
  venueId: number | null;
  startDate: Date | null;
  endDate: Date | null;
  ticketOpenDate: Date | null;
  source: string;
  sourceId: string;
  sourceUrl: string;
  imageUrl: string | null;
  genre: string;
  status: string;
  createdAt: Date;
}): Performance {
  return {
    id: row.id,
    title: row.title,
    rawTitle: row.rawTitle,
    kopisId: row.kopisId,
    venueId: row.venueId,
    startDate: row.startDate,
    endDate: row.endDate,
    ticketOpenDate: row.ticketOpenDate,
    source: row.source as Performance["source"],
    sourceId: row.sourceId,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl,
    genre: row.genre as Performance["genre"],
    status: row.status as Performance["status"],
    createdAt: row.createdAt,
  };
}

function toListItem(row: {
  id: number;
  title: string;
  rawTitle: string;
  kopisId: string | null;
  venueId: number | null;
  startDate: Date | null;
  endDate: Date | null;
  ticketOpenDate: Date | null;
  source: string;
  sourceId: string;
  sourceUrl: string;
  imageUrl: string | null;
  genre: string;
  status: string;
  createdAt: Date;
  performanceArtists: Array<{ artist: { id: number; name: string; nameEn: string | null } }>;
  venue: { id: number; name: string } | null;
}): PerformanceListItem {
  return {
    ...toPerformance(row),
    artists: row.performanceArtists.map((pa) => pa.artist),
    venue: row.venue,
  };
}

function buildCursorPage<TRow extends { id: number }, TItem>(
  rows: TRow[],
  limit: number,
  mapper: (row: TRow) => TItem
): CursorPage<TItem> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: items.map(mapper),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
