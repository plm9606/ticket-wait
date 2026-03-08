import * as cheerio from "cheerio";
import { BaseCrawler } from "./base.crawler.js";
import type { TicketSource } from "@prisma/client";
import type { RawConcertData } from "@concert-alert/shared";

/**
 * 멜론티켓 크롤러
 *
 * 멜론티켓은 API 직접 접근이 제한되어 있어 (tktapi.melon.com은 Referer 체크),
 * 메인 페이지 HTML에서 공연 정보를 추출합니다.
 * 데이터량이 인터파크/YES24보다 적을 수 있습니다.
 */
export class MelonCrawler extends BaseCrawler {
  source: TicketSource = "MELON";

  private readonly BASE_URL = "https://ticket.melon.com";

  async fetchConcerts(): Promise<RawConcertData[]> {
    const results: RawConcertData[] = [];

    // 콘서트 장르 페이지 크롤링
    try {
      const html = await this.fetchWithRetry<string>(
        `${this.BASE_URL}/concert/index.htm`,
        {
          headers: {
            Referer: `${this.BASE_URL}/main/index.htm`,
            Accept: "text/html",
          },
          responseType: "text",
        }
      );

      const items = this.parseHtml(html);
      results.push(...items);
    } catch (err) {
      console.warn(
        `[MELON] Failed to fetch concert page:`,
        err instanceof Error ? err.message : err
      );
    }

    // 메인 페이지도 크롤링
    try {
      await this.delay(3000);
      const html = await this.fetchWithRetry<string>(
        `${this.BASE_URL}/main/index.htm`,
        {
          headers: { Accept: "text/html" },
          responseType: "text",
        }
      );

      const items = this.parseHtml(html);
      // 중복 제거 후 추가
      const existingIds = new Set(results.map((r) => r.sourceId));
      for (const item of items) {
        if (!existingIds.has(item.sourceId)) {
          results.push(item);
        }
      }
    } catch (err) {
      console.warn(
        `[MELON] Failed to fetch main page:`,
        err instanceof Error ? err.message : err
      );
    }

    return results;
  }

  private parseHtml(html: string): RawConcertData[] {
    const $ = cheerio.load(html);
    const items: RawConcertData[] = [];

    // 멜론티켓 공연 링크 패턴: prodId, /performance/detail/...
    $("a[href*='prodId'], a[href*='/performance/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";

      // prodId 추출
      let sourceId: string | null = null;
      const prodIdMatch = href.match(/prodId=(\d+)/);
      const perfMatch = href.match(/\/performance\/detail\/(\d+)/);
      if (prodIdMatch) sourceId = prodIdMatch[1];
      else if (perfMatch) sourceId = perfMatch[1];
      if (!sourceId) return;

      // 제목
      const title =
        $el.find(".tit, .txt_tit, .tit_info").text().trim() ||
        $el.attr("title") ||
        $el.text().trim();
      if (!title || title.length < 2) return;

      // 이미지
      const img = $el.find("img");
      let imageUrl =
        img.attr("src") || img.attr("data-src") || "";
      if (imageUrl.startsWith("//")) imageUrl = `https:${imageUrl}`;

      // 장소, 날짜
      const venue =
        $el.find(".place, .txt_place").text().trim() || undefined;
      const dateText = $el.find(".date, .txt_date, .period").text().trim();

      let startDate: string | undefined;
      let endDate: string | undefined;
      const dateMatch = dateText.match(
        /(\d{4}[\.\-\/]\d{2}[\.\-\/]\d{2})/g
      );
      if (dateMatch) {
        startDate = dateMatch[0].replace(/[\.\/]/g, "-");
        endDate = dateMatch[1]?.replace(/[\.\/]/g, "-");
      }

      items.push({
        title,
        venue,
        startDate,
        endDate,
        sourceId,
        sourceUrl: href.startsWith("http")
          ? href
          : `${this.BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`,
        imageUrl: imageUrl || undefined,
      });
    });

    return items;
  }
}
