import * as cheerio from "cheerio";
import { BaseCrawler } from "./base.crawler.js";
import type { TicketSource } from "@prisma/client";
import type { RawConcertData } from "@concert-alert/shared";

export class Yes24Crawler extends BaseCrawler {
  source: TicketSource = "YES24";

  private readonly GENRE_URL =
    "https://ticket.yes24.com/New/Genre/Ajax/GenreList_Data.aspx";
  private readonly CONCERT_GENRE = "15456";

  async fetchConcerts(): Promise<RawConcertData[]> {
    const results: RawConcertData[] = [];
    const maxPages = 3;

    for (let page = 1; page <= maxPages; page++) {
      try {
        const html = await this.fetchWithRetry<string>(this.GENRE_URL, {
          params: {
            genre: this.CONCERT_GENRE,
            sort: "3", // 최신순
            area: "",
            genretype: "1",
            pCurPage: page,
            pPageSize: 20,
          },
          headers: {
            Referer: `https://ticket.yes24.com/New/Genre/GenreList.aspx?genre=${this.CONCERT_GENRE}`,
            "X-Requested-With": "XMLHttpRequest",
          },
          responseType: "text",
        });

        const items = this.parseHtml(html);
        if (items.length === 0) break;

        results.push(...items);
        await this.delay(3000);
      } catch (err) {
        console.warn(
          `[YES24] Failed to fetch page ${page}:`,
          err instanceof Error ? err.message : err
        );
        break;
      }
    }

    return results;
  }

  private parseHtml(html: string): RawConcertData[] {
    const $ = cheerio.load(html);
    const items: RawConcertData[] = [];

    $("a[onclick*='jsf_base_GoToPerfDetail']").each((_, el) => {
      const $el = $(el);

      // sourceId: jsf_base_GoToPerfDetail(57239)
      const onclick = $el.attr("onclick") || "";
      const idMatch = onclick.match(/GoToPerfDetail\((\d+)\)/);
      if (!idMatch) return;
      const sourceId = idMatch[1];

      // 제목
      const title = $el.find(".list-b-tit1").text().trim();
      if (!title) return;

      // 날짜, 장소
      const tit2Elements = $el.find(".list-b-tit2");
      const dateText = tit2Elements.eq(0).text().trim(); // "2026.03.28 ~ 2026.03.29"
      const venue = tit2Elements.eq(1).text().trim() || undefined;

      // 날짜 파싱
      let startDate: string | undefined;
      let endDate: string | undefined;
      const dateMatch = dateText.match(
        /(\d{4}\.\d{2}\.\d{2})\s*~\s*(\d{4}\.\d{2}\.\d{2})/
      );
      if (dateMatch) {
        startDate = dateMatch[1].replace(/\./g, "-");
        endDate = dateMatch[2].replace(/\./g, "-");
      }

      // 이미지
      const imgSrc = $el.find("img").attr("data-src") || "";
      const imageUrl = imgSrc.startsWith("//") ? `https:${imgSrc}` : imgSrc;

      items.push({
        title,
        venue,
        startDate,
        endDate,
        sourceId,
        sourceUrl: `https://ticket.yes24.com/Perf/${sourceId}`,
        imageUrl: imageUrl || undefined,
      });
    });

    return items;
  }
}
