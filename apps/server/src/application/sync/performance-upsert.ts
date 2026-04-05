import type { IPerformanceRepository } from "../../ports/out/performance.port.js";
import type { PerformanceGenre, TicketSource } from "../../domain/enums.js";
import type { RelateLink } from "../../infrastructure/external/kopis.adapter.js";

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
        const match = u.pathname.match(/\/goods\/(\w+)/);
        return match?.[1] ?? url;
      }
      case "YES24": {
        const match = u.pathname.match(/\/Perf\/(\w+)/i);
        return match?.[1] ?? url;
      }
      case "MELON": {
        return u.searchParams.get("prodId") ?? url;
      }
    }
  } catch {
    return url;
  }
}

export function parseKopisDate(dateStr: string): Date | null {
  const parts = dateStr.split(".");
  if (parts.length !== 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

export function mapPrfstate(prfstate: string): "UPCOMING" | "ON_SALE" | "COMPLETED" {
  if (prfstate === "03") return "COMPLETED";
  if (prfstate === "02") return "ON_SALE";
  return "UPCOMING";
}

export interface UpsertResult {
  newIds: number[];
  updatedCount: number;
}

export interface PerformanceUpsertParams {
  kopisId: string;
  prfnm: string;
  prfpdfrom: string;
  prfpdto: string;
  prfstate: string;
  poster: string;
  relates: RelateLink[];
  genre: PerformanceGenre;
  artistId: number | null;
  venueId: number | null;
}

export async function upsertPerformances(
  params: PerformanceUpsertParams,
  repo: IPerformanceRepository
): Promise<UpsertResult> {
  const newIds: number[] = [];
  let updatedCount = 0;

  const sourceLinks: Array<{ source: TicketSource; relate: RelateLink }> = [];
  for (const relate of params.relates) {
    const source = mapRelateToSource(relate.relatenm);
    if (source) sourceLinks.push({ source, relate });
  }

  if (sourceLinks.length === 0) return { newIds, updatedCount };

  const startDate = parseKopisDate(params.prfpdfrom);
  const endDate = parseKopisDate(params.prfpdto);
  const status = mapPrfstate(params.prfstate);

  for (const { source, relate } of sourceLinks) {
    const sourceId = extractSourceId(relate.relateurl, source);
    const { performance, isNew } = await repo.upsert({
      title: params.prfnm,
      rawTitle: params.prfnm,
      kopisId: params.kopisId,
      source,
      sourceId,
      sourceUrl: relate.relateurl,
      artistId: params.artistId,
      venueId: params.venueId,
      startDate,
      endDate,
      imageUrl: params.poster || null,
      genre: params.genre,
      status,
    });

    if (isNew && params.artistId) {
      newIds.push(performance.id);
    } else if (!isNew) {
      updatedCount++;
    }
  }

  return { newIds, updatedCount };
}
