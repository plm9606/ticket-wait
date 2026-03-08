import cron from "node-cron";
import { InterparkCrawler } from "./interpark.crawler.js";
import { Yes24Crawler } from "./yes24.crawler.js";
import { MelonCrawler } from "./melon.crawler.js";
import { matchUnmatchedConcerts } from "./matcher.js";

const interpark = new InterparkCrawler();
const yes24 = new Yes24Crawler();
const melon = new MelonCrawler();

/**
 * 크롤러 스케줄러 시작
 * - 매 30분: 인터파크 (0분), YES24 (10분), 멜론 (20분) 분산 실행
 * - 매 크롤링 후 아티스트 매칭 실행
 */
export function startScheduler() {
  // 인터파크: 매시 0분, 30분
  cron.schedule("0,30 * * * *", async () => {
    console.log("[Scheduler] Running Interpark crawler...");
    await interpark.run();
    await matchUnmatchedConcerts();
  });

  // YES24: 매시 10분, 40분
  cron.schedule("10,40 * * * *", async () => {
    console.log("[Scheduler] Running YES24 crawler...");
    await yes24.run();
    await matchUnmatchedConcerts();
  });

  // 멜론: 매시 20분, 50분
  cron.schedule("20,50 * * * *", async () => {
    console.log("[Scheduler] Running Melon crawler...");
    await melon.run();
    await matchUnmatchedConcerts();
  });

  console.log("[Scheduler] Crawler scheduler started");
}
