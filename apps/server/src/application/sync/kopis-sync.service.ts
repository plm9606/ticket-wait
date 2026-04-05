import type { IArtistRepository } from "../../ports/out/artist.port.js";
import type { IPerformanceRepository } from "../../ports/out/performance.port.js";
import type { IVenueRepository } from "../../ports/out/venue.port.js";
import type { ISyncLogRepository } from "../../ports/out/sync-log.port.js";
import type { ISyncDlqRepository } from "../../ports/out/sync-dlq.port.js";
import type { INotificationUseCase } from "../../ports/in/notification.use-case.js";
import type { IEnrichArtistUseCase } from "../../ports/in/enrich-artist.use-case.js";
import type { IKopisPort, GenreCode, PerformanceDetail } from "../../ports/out/kopis.port.js";
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
  private venueCache = new Map<string, number>();

  constructor(
    private kopis: IKopisPort,
    private artists: IArtistRepository,
    private performances: IPerformanceRepository,
    private venues: IVenueRepository,
    private syncLogs: ISyncLogRepository,
    private syncDlq: ISyncDlqRepository,
    private notifications: INotificationUseCase,
    private enrichArtist?: IEnrichArtistUseCase
  ) {}

  async syncVenues(): Promise<void> {
    const log = await this.syncLogs.create("KOPIS_VENUE");
    console.log(`[VenueSync] 시작 (logId=${log.id})`);

    try {
      const lastSuccess = await this.syncLogs.findLastSuccess("KOPIS_VENUE");
      const afterdate = lastSuccess ? formatDate(lastSuccess.startedAt) : undefined;
      console.log(`[VenueSync] 기준일: ${afterdate ?? "전체"}`);

      let itemsFound = 0;
      let newItems = 0;
      let updatedItems = 0;
      let page = 1;

      while (true) {
        const facilities = await this.kopis.listFacilities({ cpage: page, rows: 100, afterdate });
        if (facilities.length === 0) break;
        itemsFound += facilities.length;
        console.log(`[VenueSync] p${page}: ${facilities.length}건 조회 (누적 ${itemsFound}건)`);

        for (const f of facilities) {
          const detail = await this.kopis.getFacility(f.mt10id);
          if (!detail) {
            console.log(`[VenueSync]   ${f.mt10id} 상세 조회 실패, 스킵`);
            continue;
          }

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

          if (existing) {
            updatedItems++;
            console.log(`[VenueSync]   ~ 업데이트: ${detail.fcltynm}`);
          } else {
            newItems++;
            console.log(`[VenueSync]   + 신규: ${detail.fcltynm}`);
          }
        }

        if (facilities.length < 100) break;
        page++;
      }

      await this.syncLogs.markSuccess(log.id, { itemsFound, newItems, updatedItems });
      console.log(`[VenueSync] 완료: ${itemsFound}건 조회, ${newItems}건 신규, ${updatedItems}건 업데이트`);
    } catch (error) {
      await this.syncLogs.markFailed(log.id, error instanceof Error ? error.message : String(error));
      console.error("[VenueSync] 실패:", error);
    }
  }

  async syncPerformances(): Promise<void> {
    const log = await this.syncLogs.create("KOPIS");
    console.log(`[PerformanceSync] 시작 (logId=${log.id})`);

    try {
      this.venueCache.clear();

      let totalFound = 0;
      let totalNew = 0;
      let totalUpdated = 0;
      const allNewIds: number[] = [];

      const windows = buildDateWindows();
      const genreCount = SYNC_GENRE_CODES.length;
      console.log(`[PerformanceSync] 장르 ${genreCount}개 × 날짜 윈도우 ${windows.length}개`);

      for (let gi = 0; gi < SYNC_GENRE_CODES.length; gi++) {
        const shcate = SYNC_GENRE_CODES[gi];
        console.log(`[PerformanceSync] 장르 [${gi + 1}/${genreCount}] ${shcate} 시작`);

        for (let wi = 0; wi < windows.length; wi++) {
          const { stdate, eddate } = windows[wi];
          let page = 1;
          let windowFound = 0;

          while (true) {
            const summaries = await this.kopis.listPerformances({ stdate, eddate, shcate, rows: 100, cpage: page });
            if (summaries.length === 0) break;
            totalFound += summaries.length;
            windowFound += summaries.length;
            console.log(`[PerformanceSync]   ${stdate}~${eddate} p${page}: ${summaries.length}건 조회`);

            for (let si = 0; si < summaries.length; si++) {
              const summary = summaries[si];
              const detail = await this.kopis.getPerformance(summary.mt20id);
              if (!detail) {
                console.log(`[PerformanceSync]     ${summary.mt20id} 상세 조회 실패, 스킵`);
                continue;
              }

              const genre = mapGenre(shcate, detail.prfnm);
              const artistIds = await this.matchArtistsForPerformance(detail);
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
                  artistIds,
                  venueId,
                },
                this.performances
              );

              if (newIds.length > 0) {
                console.log(`[PerformanceSync]     + 신규: ${detail.prfnm} (${detail.mt20id})`);
              } else if (updatedCount > 0) {
                console.log(`[PerformanceSync]     ~ 업데이트: ${detail.prfnm} (${detail.mt20id})`);
              }

              totalNew += newIds.length;
              totalUpdated += updatedCount;
              allNewIds.push(...newIds);
            }

            if (summaries.length < 100) break;
            page++;
          }

          console.log(`[PerformanceSync]   윈도우 [${wi + 1}/${windows.length}] ${stdate}~${eddate} 완료: ${windowFound}건`);
        }

        console.log(`[PerformanceSync] 장르 ${shcate} 완료 (누적: ${totalFound}건 조회, ${totalNew}건 신규, ${totalUpdated}건 업데이트)`);
      }

      if (allNewIds.length > 0) {
        console.log(`[PerformanceSync] 푸시 알림 발송 중 (${allNewIds.length}건)...`);
        const sent = await this.notifications.notifyNewPerformances(allNewIds);
        console.log(`[PerformanceSync] 푸시 알림 ${sent}건 발송 완료`);
      }

      await this.syncLogs.markSuccess(log.id, {
        itemsFound: totalFound,
        newItems: totalNew,
        updatedItems: totalUpdated,
      });
      console.log(`[PerformanceSync] 완료: ${totalFound}건 조회, ${totalNew}건 신규, ${totalUpdated}건 업데이트`);
    } catch (error) {
      await this.syncLogs.markFailed(log.id, error instanceof Error ? error.message : String(error));
      console.error("[PerformanceSync] 실패:", error);
    }
  }

  private async matchArtistsForPerformance(detail: PerformanceDetail): Promise<number[]> {
    const castNames = parseCastNames(detail.prfcast);
    const prfnm = detail.prfnm?.trim();

    if (castNames.length === 0 || !prfnm) {
      console.error(`[PerformanceSync] prfnm or prfcast 없음 (kopisId=${detail.mt20id}), DLQ 저장`);
      await this.syncDlq.upsert({
        kopisId: detail.mt20id,
        reason: "prfnm or prfcast is null or empty",
        rawData: detail as unknown as object,
      });
      return [];
    }

    // 각 캐스트 이름별로 매칭 시도, 없으면 신규 생성
    const artistIds: number[] = [];
    for (const name of castNames) {
      const existing = await this.artists.findByName(name);
      if (existing) {
        artistIds.push(existing.id);
      } else {
        const isEnglish = /^[a-zA-Z0-9\s\-.]+$/.test(name);
        const newArtist = await this.artists.create({
          name,
          nameEn: isEnglish ? name : null,
          aliases: [],
        });
        console.log(`[PerformanceSync] 신규 아티스트 생성: ${name}`);
        if (this.enrichArtist) {
          await this.enrichArtist.enrichOne(newArtist.id);
        }
        artistIds.push(newArtist.id);
      }
    }

    return artistIds;
  }

  private async upsertVenue(mt10id: string, fallbackName: string): Promise<number> {
    const cached = this.venueCache.get(mt10id);
    if (cached) return cached;

    const existing = await this.venues.findByKopisId(mt10id);
    if (existing) {
      this.venueCache.set(mt10id, existing.id);
      return existing.id;
    }

    const facility = await this.kopis.getFacility(mt10id);
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
