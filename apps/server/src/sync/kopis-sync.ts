import { prisma } from "../lib/prisma.js";
import {
  listPerformances,
  getPerformance,
  getFacility,
  type GenreCode,
  type PerformanceDetail,
  type RelateLink,
} from "../lib/kopis.js";
import { matchArtist, clearArtistCache, classifyGenre } from "../crawlers/matcher.js";
import { notifyNewPerformances } from "../services/notification.service.js";
import type { TicketSource, PerformanceGenre } from "@prisma/client";

// ─── Genre Mapping ───────────────────────────────────────────────────────────

const KOPIS_GENRE_MAP: Record<string, PerformanceGenre> = {
  CCCD: "CONCERT",
  GGGA: "MUSICAL",
  CCCA: "CLASSIC",
  AAAA: "OTHER", // 연극
};

const SYNC_GENRE_CODES: GenreCode[] = ["CCCD", "GGGA", "CCCA", "AAAA"];

export function mapGenre(shcate: GenreCode, title: string): PerformanceGenre {
  const base = KOPIS_GENRE_MAP[shcate] ?? "OTHER";
  // 대중음악(CCCD)만 제목 기반 세분화
  if (shcate === "CCCD") return classifyGenre(title);
  return base;
}

// ─── TicketSource Mapping ────────────────────────────────────────────────────

export function mapRelateToSource(relatenm: string): TicketSource | null {
  const name = relatenm.toLowerCase();
  if (name.includes("인터파크") || name.includes("interpark")) return "INTERPARK";
  if (name.includes("yes24")) return "YES24";
  if (name.includes("멜론") || name.includes("melon")) return "MELON";
  return null;
}

export function extractSourceId(url: string, source: TicketSource): string {
  try {
    const u = new URL(url);
    switch (source) {
      case "INTERPARK": {
        // https://tickets.interpark.com/goods/XXXX
        const match = u.pathname.match(/\/goods\/(\w+)/);
        return match?.[1] ?? url;
      }
      case "YES24": {
        // https://ticket.yes24.com/Perf/XXXX
        const match = u.pathname.match(/\/Perf\/(\w+)/i);
        return match?.[1] ?? url;
      }
      case "MELON": {
        // https://ticket.melon.com/performance/index.htm?prodId=XXXX
        return u.searchParams.get("prodId") ?? url;
      }
    }
  } catch {
    return url;
  }
}

// ─── Date Helpers ────────────────────────────────────────────────────────────

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function parseKopisDate(dateStr: string): Date | null {
  // "YYYY.MM.DD" → Date
  const parts = dateStr.split(".");
  if (parts.length !== 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

/**
 * 오늘~90일 후를 31일씩 윈도우로 분할
 */
export function buildDateWindows(): Array<{ stdate: string; eddate: string }> {
  const windows: Array<{ stdate: string; eddate: string }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start = new Date(today);
  const end = new Date(today);
  end.setDate(end.getDate() + 90);

  while (start < end) {
    const windowEnd = new Date(start);
    windowEnd.setDate(windowEnd.getDate() + 30); // 31일 범위 (start 포함)
    if (windowEnd > end) windowEnd.setTime(end.getTime());

    windows.push({
      stdate: formatDate(start),
      eddate: formatDate(windowEnd),
    });

    const nextStart = new Date(windowEnd);
    nextStart.setDate(nextStart.getDate() + 1);
    start = nextStart;
  }

  return windows;
}

// ─── Venue Upsert ────────────────────────────────────────────────────────────

const venueCache = new Map<string, number>(); // kopisId → venueId

async function upsertVenue(mt10id: string, fallbackName: string): Promise<number> {
  const cached = venueCache.get(mt10id);
  if (cached) return cached;

  const existing = await prisma.venue.findUnique({ where: { kopisId: mt10id } });
  if (existing) {
    venueCache.set(mt10id, existing.id);
    return existing.id;
  }

  const facility = await getFacility(mt10id);
  const venue = await prisma.venue.create({
    data: {
      name: facility?.fcltynm ?? fallbackName,
      kopisId: mt10id,
      address: facility?.adres ?? null,
      lat: facility?.la ? parseFloat(facility.la) : null,
      lng: facility?.lo ? parseFloat(facility.lo) : null,
      seatScale: facility?.seatscale ? parseInt(facility.seatscale) : null,
      phone: facility?.telno ?? null,
      website: facility?.relateurl ?? null,
      sido: facility?.sidonm ?? null,
      gugun: facility?.gugunnm ?? null,
    },
  });

  venueCache.set(mt10id, venue.id);
  return venue.id;
}

// ─── Artist Matching ─────────────────────────────────────────────────────────

export function parseCastNames(prfcast: string | null | undefined): string[] {
  if (!prfcast || prfcast.trim() === "") return [];
  return prfcast
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function matchArtistForPerformance(
  detail: PerformanceDetail
): Promise<number | null> {
  // 1. prfcast 파싱된 이름으로 시도
  const castNames = parseCastNames(detail.prfcast);
  for (const name of castNames) {
    const artistId = await matchArtist(name);
    if (artistId) return artistId;
  }

  // 2. 제목 기반 fallback
  return matchArtist(detail.prfnm);
}

// ─── Performance Upsert ──────────────────────────────────────────────────────

interface UpsertResult {
  newIds: number[];
  updatedCount: number;
}

async function upsertPerformances(
  detail: PerformanceDetail,
  genre: PerformanceGenre,
  artistId: number | null,
  venueId: number | null
): Promise<UpsertResult> {
  const newIds: number[] = [];
  let updatedCount = 0;

  // relates에서 인식 가능한 예매처 추출
  const sourceLinks: Array<{ source: TicketSource; relate: RelateLink }> = [];
  for (const relate of detail.relates) {
    const source = mapRelateToSource(relate.relatenm);
    if (source) sourceLinks.push({ source, relate });
  }

  if (sourceLinks.length === 0) return { newIds, updatedCount };

  const startDate = parseKopisDate(detail.prfpdfrom);
  const endDate = parseKopisDate(detail.prfpdto);

  for (const { source, relate } of sourceLinks) {
    const sourceId = extractSourceId(relate.relateurl, source);

    const existing = await prisma.performance.findFirst({
      where: { kopisId: detail.mt20id, source },
    });

    if (existing) {
      await prisma.performance.update({
        where: { id: existing.id },
        data: {
          title: detail.prfnm,
          startDate,
          endDate,
          venueId,
          imageUrl: detail.poster || null,
          sourceUrl: relate.relateurl,
          artistId,
          genre,
          status: detail.prfstate === "03" ? "COMPLETED" : detail.prfstate === "02" ? "ON_SALE" : "UPCOMING",
        },
      });
      updatedCount++;
    } else {
      const perf = await prisma.performance.create({
        data: {
          title: detail.prfnm,
          rawTitle: detail.prfnm,
          kopisId: detail.mt20id,
          source,
          sourceId,
          sourceUrl: relate.relateurl,
          artistId,
          venueId,
          startDate,
          endDate,
          imageUrl: detail.poster || null,
          genre,
          status: detail.prfstate === "03" ? "COMPLETED" : detail.prfstate === "02" ? "ON_SALE" : "UPCOMING",
        },
      });
      if (artistId) newIds.push(perf.id);
    }
  }

  return { newIds, updatedCount };
}

// ─── Venue Sync Job ──────────────────────────────────────────────────────────

export async function syncVenues(): Promise<void> {
  const log = await prisma.syncLog.create({
    data: { source: "KOPIS_VENUE", status: "RUNNING" },
  });

  try {
    // 마지막 성공 동기화일 조회
    const lastSync = await prisma.syncLog.findFirst({
      where: { source: "KOPIS_VENUE", status: "SUCCESS" },
      orderBy: { startedAt: "desc" },
    });
    const afterdate = lastSync
      ? formatDate(lastSync.startedAt)
      : undefined;

    let itemsFound = 0;
    let newItems = 0;
    let updatedItems = 0;
    let page = 1;

    while (true) {
      const facilities = await listFacilities({
        cpage: page,
        rows: 100,
        afterdate,
      });

      if (facilities.length === 0) break;
      itemsFound += facilities.length;

      for (const f of facilities) {
        const detail = await getFacility(f.mt10id);
        if (!detail) continue;

        const existing = await prisma.venue.findUnique({
          where: { kopisId: f.mt10id },
        });

        if (existing) {
          await prisma.venue.update({
            where: { id: existing.id },
            data: {
              name: detail.fcltynm,
              address: detail.adres || null,
              lat: detail.la ? parseFloat(detail.la) : null,
              lng: detail.lo ? parseFloat(detail.lo) : null,
              seatScale: detail.seatscale ? parseInt(detail.seatscale) : null,
              phone: detail.telno || null,
              website: detail.relateurl || null,
              sido: detail.sidonm || null,
              gugun: detail.gugunnm || null,
            },
          });
          updatedItems++;
        } else {
          await prisma.venue.create({
            data: {
              name: detail.fcltynm,
              kopisId: f.mt10id,
              address: detail.adres || null,
              lat: detail.la ? parseFloat(detail.la) : null,
              lng: detail.lo ? parseFloat(detail.lo) : null,
              seatScale: detail.seatscale ? parseInt(detail.seatscale) : null,
              phone: detail.telno || null,
              website: detail.relateurl || null,
              sido: detail.sidonm || null,
              gugun: detail.gugunnm || null,
            },
          });
          newItems++;
        }
      }

      if (facilities.length < 100) break;
      page++;
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        itemsFound,
        newItems,
        updatedItems,
      },
    });

    console.log(
      `[VenueSync] Done: ${itemsFound} found, ${newItems} new, ${updatedItems} updated`
    );
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errors: error instanceof Error ? error.message : String(error),
      },
    });
    console.error("[VenueSync] Failed:", error);
  }
}

// ─── Performance Sync Job ────────────────────────────────────────────────────

import { listFacilities } from "../lib/kopis.js";

export async function syncPerformances(): Promise<void> {
  const log = await prisma.syncLog.create({
    data: { source: "KOPIS", status: "RUNNING" },
  });

  try {
    clearArtistCache();
    venueCache.clear();

    let totalFound = 0;
    let totalNew = 0;
    let totalUpdated = 0;
    const allNewIds: number[] = [];

    const windows = buildDateWindows();

    for (const shcate of SYNC_GENRE_CODES) {
      for (const { stdate, eddate } of windows) {
        let page = 1;

        while (true) {
          const summaries = await listPerformances({
            stdate,
            eddate,
            shcate,
            rows: 100,
            cpage: page,
          });

          if (summaries.length === 0) break;
          totalFound += summaries.length;

          for (const summary of summaries) {
            const detail = await getPerformance(summary.mt20id);
            if (!detail) continue;

            // Genre
            const genre = mapGenre(shcate, detail.prfnm);

            // Artist
            const artistId = await matchArtistForPerformance(detail);

            // Venue
            let venueId: number | null = null;
            if (detail.mt10id) {
              venueId = await upsertVenue(detail.mt10id, detail.fcltynm);
            }

            // Upsert performances
            const { newIds, updatedCount } = await upsertPerformances(
              detail,
              genre,
              artistId,
              venueId
            );

            totalNew += newIds.length;
            totalUpdated += updatedCount;
            allNewIds.push(...newIds);
          }

          if (summaries.length < 100) break;
          page++;
        }
      }
    }

    // 새로 매칭된 공연에 대해 알림 발송
    if (allNewIds.length > 0) {
      const sent = await notifyNewPerformances(allNewIds);
      console.log(`[PerformanceSync] ${sent} push notifications sent`);
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        itemsFound: totalFound,
        newItems: totalNew,
        updatedItems: totalUpdated,
      },
    });

    console.log(
      `[PerformanceSync] Done: ${totalFound} found, ${totalNew} new, ${totalUpdated} updated`
    );
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errors: error instanceof Error ? error.message : String(error),
      },
    });
    console.error("[PerformanceSync] Failed:", error);
  }
}
