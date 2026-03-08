import { BaseCrawler } from "./base.crawler.js";
import type { TicketSource } from "@prisma/client";
import type { RawConcertData } from "@concert-alert/shared";

interface InterparkItem {
  goodsCode: string;
  goodsName: string;
  placeName: string;
  playStartDate: string; // "20260404"
  playEndDate: string;
  imageUrl: string; // "//ticketimage.interpark.com/..."
  url: string; // "//ticket.interpark.com/..."
}

interface InterparkRankingResponse {
  concert?: InterparkItem[];
  [key: string]: InterparkItem[] | undefined;
}

export class InterparkCrawler extends BaseCrawler {
  source: TicketSource = "INTERPARK";

  private readonly BASE_URL = "https://tickets.interpark.com/api";

  async fetchConcerts(): Promise<RawConcertData[]> {
    const results: RawConcertData[] = [];

    // 일간/주간/월간 랭킹 크롤링
    for (const period of ["D", "W", "M"]) {
      try {
        const data = await this.fetchWithRetry<InterparkRankingResponse>(
          `${this.BASE_URL}/ranking`,
          {
            params: {
              genre: "concert",
              period,
              page: 1,
              pageSize: 50,
            },
            headers: {
              Accept: "application/json",
              Referer: "https://tickets.interpark.com/",
            },
          }
        );

        const concerts = data.concert || [];

        for (const item of concerts) {
          results.push({
            title: item.goodsName,
            venue: item.placeName,
            startDate: this.parseDate(item.playStartDate),
            endDate: this.parseDate(item.playEndDate),
            sourceId: item.goodsCode,
            sourceUrl: item.url.startsWith("//")
              ? `https:${item.url}`
              : item.url,
            imageUrl: item.imageUrl.startsWith("//")
              ? `https:${item.imageUrl}`
              : item.imageUrl,
          });
        }

        await this.delay(2000);
      } catch (err) {
        console.warn(
          `[INTERPARK] Failed to fetch ${period} ranking:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    // sourceId 기준 중복 제거
    const unique = new Map<string, RawConcertData>();
    for (const item of results) {
      if (!unique.has(item.sourceId)) {
        unique.set(item.sourceId, item);
      }
    }

    return Array.from(unique.values());
  }

  private parseDate(dateStr: string): string | undefined {
    if (!dateStr || dateStr.length !== 8) return undefined;
    const y = dateStr.slice(0, 4);
    const m = dateStr.slice(4, 6);
    const d = dateStr.slice(6, 8);
    return `${y}-${m}-${d}`;
  }
}
