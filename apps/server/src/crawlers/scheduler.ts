import cron from "node-cron";
import { InterparkCrawler } from "./interpark.crawler.js";
import { Yes24Crawler } from "./yes24.crawler.js";
import { MelonCrawler } from "./melon.crawler.js";
import { matchUnmatchedConcerts, classifyUnclassifiedConcerts } from "./matcher.js";
import { notifyNewConcerts, sendTicketOpenReminders } from "../services/notification.service.js";
import { prisma } from "../lib/prisma.js";
import type { BaseCrawler } from "./base.crawler.js";

const interpark = new InterparkCrawler();
const yes24 = new Yes24Crawler();
const melon = new MelonCrawler();

/**
 * 크롤링 → 매칭 → 알림 파이프라인
 */
async function runCrawlPipeline(crawler: BaseCrawler) {
  await crawler.run();
  await classifyUnclassifiedConcerts();
  const matched = await matchUnmatchedConcerts();

  // 매칭된 새 공연에 대해 알림 발송
  if (matched > 0) {
    const newlyMatched = await prisma.concert.findMany({
      where: {
        artistId: { not: null },
        notifications: { none: {} },
      },
      select: { id: true },
    });

    if (newlyMatched.length > 0) {
      const sent = await notifyNewConcerts(newlyMatched.map((c) => c.id));
      console.log(`[Scheduler] ${sent} push notifications sent`);
    }
  }
}

/**
 * 크롤러 스케줄러 시작
 * - 매 30분: 인터파크 (0분), YES24 (10분), 멜론 (20분) 분산 실행
 * - 매일 오전 9시: 티켓 오픈 리마인더
 */
export function startScheduler() {
  // 인터파크: 매시 0분, 30분
  cron.schedule("0,30 * * * *", async () => {
    console.log("[Scheduler] Running Interpark crawler...");
    await runCrawlPipeline(interpark);
  });

  // YES24: 매시 10분, 40분
  cron.schedule("10,40 * * * *", async () => {
    console.log("[Scheduler] Running YES24 crawler...");
    await runCrawlPipeline(yes24);
  });

  // 멜론: 매시 20분, 50분
  cron.schedule("20,50 * * * *", async () => {
    console.log("[Scheduler] Running Melon crawler...");
    await runCrawlPipeline(melon);
  });

  // 매일 오전 9시 (KST) 티켓 오픈 리마인더
  cron.schedule("0 0 * * *", async () => {
    console.log("[Scheduler] Sending ticket open reminders...");
    const sent = await sendTicketOpenReminders();
    console.log(`[Scheduler] ${sent} ticket open reminders sent`);
  });

  console.log("[Scheduler] Crawler scheduler started");
}
