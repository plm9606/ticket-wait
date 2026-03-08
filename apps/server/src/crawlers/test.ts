import "dotenv/config";
import { InterparkCrawler } from "./interpark.crawler.js";
import { Yes24Crawler } from "./yes24.crawler.js";
import { MelonCrawler } from "./melon.crawler.js";
import { matchUnmatchedConcerts } from "./matcher.js";
import { prisma } from "../lib/prisma.js";

async function testCrawlers() {
  const args = process.argv.slice(2);
  const target = args[0] || "all";

  console.log(`\n=== 크롤러 테스트 (${target}) ===\n`);

  if (target === "all" || target === "interpark") {
    console.log("[인터파크] 크롤링 시작...");
    const interpark = new InterparkCrawler();
    const result = await interpark.run();
    console.log(
      `[인터파크] 완료: ${result.itemsFound}건 발견, ${result.newItems}건 신규`
    );
    if (result.errors) console.error(`[인터파크] 에러: ${result.errors}`);
    console.log();
  }

  if (target === "all" || target === "yes24") {
    console.log("[YES24] 크롤링 시작...");
    const yes24 = new Yes24Crawler();
    const result = await yes24.run();
    console.log(
      `[YES24] 완료: ${result.itemsFound}건 발견, ${result.newItems}건 신규`
    );
    if (result.errors) console.error(`[YES24] 에러: ${result.errors}`);
    console.log();
  }

  if (target === "all" || target === "melon") {
    console.log("[멜론] 크롤링 시작...");
    const melon = new MelonCrawler();
    const result = await melon.run();
    console.log(
      `[멜론] 완료: ${result.itemsFound}건 발견, ${result.newItems}건 신규`
    );
    if (result.errors) console.error(`[멜론] 에러: ${result.errors}`);
    console.log();
  }

  // 아티스트 매칭
  console.log("[매칭] 아티스트 매칭 시작...");
  const matched = await matchUnmatchedConcerts();
  console.log(`[매칭] ${matched}건 매칭 완료`);

  // 결과 요약
  const totalConcerts = await prisma.concert.count();
  const matchedConcerts = await prisma.concert.count({
    where: { artistId: { not: null } },
  });
  const unmatchedConcerts = totalConcerts - matchedConcerts;

  console.log(`\n=== 결과 요약 ===`);
  console.log(`총 공연: ${totalConcerts}건`);
  console.log(`매칭 완료: ${matchedConcerts}건`);
  console.log(`미매칭: ${unmatchedConcerts}건`);

  // 매칭된 공연 샘플 출력
  const samples = await prisma.concert.findMany({
    where: { artistId: { not: null } },
    include: { artist: { select: { name: true, nameEn: true } } },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  if (samples.length > 0) {
    console.log(`\n=== 매칭된 공연 샘플 ===`);
    for (const c of samples) {
      console.log(
        `  [${c.source}] "${c.title}" → ${c.artist?.name} (${c.artist?.nameEn})`
      );
    }
  }

  await prisma.$disconnect();
}

testCrawlers().catch(console.error);
