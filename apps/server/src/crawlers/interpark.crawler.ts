import { BaseCrawler } from "./base.crawler.js";
import type { TicketSource } from "@prisma/client";
import type { RawConcertData } from "@concert-alert/shared";

interface InterparkOpenNoticeItem {
  noticeId: number;
  title: string;
  openDateStr: string; // "2026-03-09 09:00:00"
  venueName: string;
  goodsGenre: number;
  goodsGenreEngStr: string; // "CONCERT" | "MUSICAL" 등
  goodsRegion: number;
  posterImageUrl: string;
  goodsCode: string;
  isHot: boolean;
  viewCount: number;
}

export class InterparkCrawler extends BaseCrawler {
  source: TicketSource = "INTERPARK";

  private readonly BASE_URL = "https://tickets.interpark.com";

  async fetchConcerts(): Promise<RawConcertData[]> {
    const items = await this.fetchWithRetry<InterparkOpenNoticeItem[]>(
      `${this.BASE_URL}/contents/api/open-notice/notice-list`,
      {
        params: {
          goodsGenre: "ALL",
          goodsRegion: "ALL",
          offset: 0,
          pageSize: 50,
          sorting: "OPEN_ASC",
        },
        headers: {
          Accept: "application/json",
          Referer: `${this.BASE_URL}/`,
        },
      }
    );

    const results: RawConcertData[] = [];

    for (const item of items) {
      if (!item.goodsCode || !item.title) continue;

      let imageUrl = item.posterImageUrl || "";
      if (imageUrl.startsWith("//")) imageUrl = `https:${imageUrl}`;

      results.push({
        title: item.title.trim(),
        venue: item.venueName || undefined,
        ticketOpenDate: this.parseOpenDate(item.openDateStr),
        sourceId: item.goodsCode,
        sourceUrl: `${this.BASE_URL}/goods/${item.goodsCode}`,
        imageUrl: imageUrl || undefined,
      });
    }

    return results;
  }

  /** "2026-03-09 09:00:00" → "2026-03-09T09:00:00" */
  private parseOpenDate(dateStr: string): string | undefined {
    if (!dateStr) return undefined;
    return dateStr.replace(" ", "T");
  }
}
