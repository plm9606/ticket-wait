import type { IArtistRepository } from "../../ports/out/artist.port.js";
import type { IPerformanceRepository } from "../../ports/out/performance.port.js";
import type { IVenueRepository } from "../../ports/out/venue.port.js";
import type { ISyncLogRepository } from "../../ports/out/sync-log.port.js";
import type { INotificationUseCase } from "../../ports/in/notification.use-case.js";
import {
  listPerformances,
  listFacilities,
  getPerformance,
  getFacility,
  type GenreCode,
  type PerformanceDetail,
} from "../../infrastructure/external/kopis.adapter.js";
import { ArtistMatcher } from "./artist-matcher.js";
import { classifyGenre } from "./genre-classifier.js";
import { upsertPerformances } from "./performance-upsert.js";
import type { PerformanceGenre } from "../../domain/enums.js";

const KOPIS_GENRE_MAP: Record<string, PerformanceGenre> = {
  CCCD: "CONCERT",
  GGGA: "MUSICAL",
  CCCA: "CLASSIC",
  AAAA: "OTHER",
};

const SYNC_GENRE_CODES: GenreCode[] = ["CCCD", "GGGA", "CCCA", "AAAA"];

export function mapGenre(shcate: GenreCode, title: string): PerformanceGenre {
  const base = KOPIS_GENRE_MAP[shcate] ?? "OTHER";
  if (shcate === "CCCD") return classifyGenre(title);
  return base;
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function buildDateWindows(): Array<{ stdate: string; eddate: string }> {
  const windows: Array<{ stdate: string; eddate: string }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start = new Date(today);
  const end = new Date(today);
  end.setDate(end.getDate() + 90);

  while (start < end) {
    const windowEnd = new Date(start);
    windowEnd.setDate(windowEnd.getDate() + 30);
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

export function parseCastNames(prfcast: string | null | undefined): string[] {
  if (!prfcast || prfcast.trim() === "") return [];
  return prfcast
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export class KopisSyncService {
  private matcher: ArtistMatcher;
  private venueCache = new Map<string, number>();

  constructor(
    private artists: IArtistRepository,
    private performances: IPerformanceRepository,
    private venues: IVenueRepository,
    private syncLogs: ISyncLogRepository,
    private notifications: INotificationUseCase
  ) {
    this.matcher = new ArtistMatcher(artists);
  }

  async syncVenues(): Promise<void> {
    const log = await this.syncLogs.create("KOPIS_VENUE");

    try {
      const lastSuccess = await this.syncLogs.findLastSuccess("KOPIS_VENUE");
      const afterdate = lastSuccess ? formatDate(lastSuccess.startedAt) : undefined;

      let itemsFound = 0;
      let newItems = 0;
      let updatedItems = 0;
      let page = 1;

      while (true) {
        const facilities = await listFacilities({ cpage: page, rows: 100, afterdate });
        if (facilities.length === 0) break;
        itemsFound += facilities.length;

        for (const f of facilities) {
          const detail = await getFacility(f.mt10id);
          if (!detail) continue;

          const existing = await this.venues.findByKopisId(f.mt10id);
          await this.venues.upsert({
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
          });

          if (existing) updatedItems++;
          else newItems++;
        }

        if (facilities.length < 100) break;
        page++;
      }

      await this.syncLogs.markSuccess(log.id, { itemsFound, newItems, updatedItems });
      console.log(`[VenueSync] Done: ${itemsFound} found, ${newItems} new, ${updatedItems} updated`);
    } catch (error) {
      await this.syncLogs.markFailed(log.id, error instanceof Error ? error.message : String(error));
      console.error("[VenueSync] Failed:", error);
    }
  }

  async syncPerformances(): Promise<void> {
    const log = await this.syncLogs.create("KOPIS");

    try {
      this.matcher.clearCache();
      this.venueCache.clear();

      let totalFound = 0;
      let totalNew = 0;
      let totalUpdated = 0;
      const allNewIds: number[] = [];

      const windows = buildDateWindows();

      for (const shcate of SYNC_GENRE_CODES) {
        for (const { stdate, eddate } of windows) {
          let page = 1;

          while (true) {
            const summaries = await listPerformances({ stdate, eddate, shcate, rows: 100, cpage: page });
            if (summaries.length === 0) break;
            totalFound += summaries.length;

            for (const summary of summaries) {
              const detail = await getPerformance(summary.mt20id);
              if (!detail) continue;

              const genre = mapGenre(shcate, detail.prfnm);
              const artistId = await this.matchArtistForPerformance(detail);
              const venueId = detail.mt10id ? await this.upsertVenue(detail.mt10id, detail.fcltynm) : null;

              const { newIds, updatedCount } = await upsertPerformances(
                {
                  kopisId: detail.mt20id,
                  prfnm: detail.prfnm,
                  prfpdfrom: detail.prfpdfrom,
                  prfpdto: detail.prfpdto,
                  prfstate: detail.prfstate,
                  poster: detail.poster,
                  relates: detail.relates,
                  genre,
                  artistId,
                  venueId,
                },
                this.performances
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

      if (allNewIds.length > 0) {
        const sent = await this.notifications.notifyNewPerformances(allNewIds);
        console.log(`[PerformanceSync] ${sent} push notifications sent`);
      }

      await this.syncLogs.markSuccess(log.id, {
        itemsFound: totalFound,
        newItems: totalNew,
        updatedItems: totalUpdated,
      });
      console.log(`[PerformanceSync] Done: ${totalFound} found, ${totalNew} new, ${totalUpdated} updated`);
    } catch (error) {
      await this.syncLogs.markFailed(log.id, error instanceof Error ? error.message : String(error));
      console.error("[PerformanceSync] Failed:", error);
    }
  }

  private async matchArtistForPerformance(detail: PerformanceDetail): Promise<number | null> {
    const castNames = parseCastNames(detail.prfcast);
    for (const name of castNames) {
      const artistId = await this.matcher.matchArtist(name);
      if (artistId) return artistId;
    }
    return this.matcher.matchArtist(detail.prfnm);
  }

  private async upsertVenue(mt10id: string, fallbackName: string): Promise<number> {
    const cached = this.venueCache.get(mt10id);
    if (cached) return cached;

    const existing = await this.venues.findByKopisId(mt10id);
    if (existing) {
      this.venueCache.set(mt10id, existing.id);
      return existing.id;
    }

    const facility = await getFacility(mt10id);
    const venue = await this.venues.upsert({
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
    });

    this.venueCache.set(mt10id, venue.id);
    return venue.id;
  }
}
