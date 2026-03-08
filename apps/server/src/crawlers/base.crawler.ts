import axios, { type AxiosInstance } from "axios";
import { prisma } from "../lib/prisma.js";
import type { TicketSource, CrawlStatus } from "@prisma/client";
import type { RawConcertData } from "@concert-alert/shared";

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 2000;
const REQUEST_DELAY_MS = 3000;

export abstract class BaseCrawler {
  abstract source: TicketSource;
  protected http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });
  }

  /**
   * 사이트별 크롤러가 구현해야 하는 메서드
   */
  abstract fetchConcerts(): Promise<RawConcertData[]>;

  /**
   * 요청 간 딜레이
   */
  protected async delay(ms: number = REQUEST_DELAY_MS): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 재시도 로직이 포함된 HTTP GET
   */
  protected async fetchWithRetry<T>(
    url: string,
    config?: Record<string, unknown>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data } = await this.http.get<T>(url, config);
        return data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `[${this.source}] Attempt ${attempt}/${MAX_RETRIES} failed for ${url}: ${lastError.message}`
        );

        if (attempt < MAX_RETRIES) {
          await this.delay(RETRY_BASE_DELAY * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * 크롤링 실행 + CrawlLog 기록 + 중복 체크
   */
  async run(): Promise<{
    itemsFound: number;
    newItems: number;
    newConcertIds: string[];
    errors: string | null;
  }> {
    const crawlLog = await prisma.crawlLog.create({
      data: { source: this.source, status: "RUNNING" },
    });

    let status: CrawlStatus = "SUCCESS";
    let errorMsg: string | null = null;
    let itemsFound = 0;
    let newItems = 0;
    const newConcertIds: string[] = [];

    try {
      const rawConcerts = await this.fetchConcerts();
      itemsFound = rawConcerts.length;

      for (const raw of rawConcerts) {
        // 중복 체크: source + sourceId
        const existing = await prisma.concert.findUnique({
          where: {
            source_sourceId: {
              source: this.source,
              sourceId: raw.sourceId,
            },
          },
        });

        if (existing) continue;

        // 새 공연 삽입
        const concert = await prisma.concert.create({
          data: {
            title: raw.title,
            venue: raw.venue || null,
            startDate: raw.startDate ? new Date(raw.startDate) : null,
            endDate: raw.endDate ? new Date(raw.endDate) : null,
            ticketOpenDate: raw.ticketOpenDate
              ? new Date(raw.ticketOpenDate)
              : null,
            source: this.source,
            sourceId: raw.sourceId,
            sourceUrl: raw.sourceUrl,
            imageUrl: raw.imageUrl || null,
            rawTitle: raw.title,
          },
        });

        newConcertIds.push(concert.id);
        newItems++;
      }

      console.log(
        `[${this.source}] Crawl complete: ${itemsFound} found, ${newItems} new`
      );
    } catch (err) {
      status = "FAILED";
      errorMsg =
        err instanceof Error ? err.message : String(err);
      console.error(`[${this.source}] Crawl failed:`, errorMsg);
    }

    // CrawlLog 업데이트
    await prisma.crawlLog.update({
      where: { id: crawlLog.id },
      data: {
        completedAt: new Date(),
        itemsFound,
        newItems,
        errors: errorMsg,
        status,
      },
    });

    return { itemsFound, newItems, newConcertIds, errors: errorMsg };
  }
}
