import { PrismaClient } from "@prisma/client";
import { normalizeForMatch } from "@concert-alert/shared";
import {
  searchArtistByName,
  mapArtist,
  type MBArtist,
} from "../lib/musicbrainz.js";

const prisma = new PrismaClient();

// --- 매칭 점수 계산 ---

function scoreMatch(
  dbName: string,
  dbNameEn: string | null,
  mb: MBArtist
): number {
  const mapped = mapArtist(mb);
  const normDbName = normalizeForMatch(dbName);
  const normDbNameEn = dbNameEn ? normalizeForMatch(dbNameEn) : null;

  // 한글 이름 정확 매칭
  if (normalizeForMatch(mapped.name) === normDbName) return 100;

  // 영문 이름 정확 매칭
  if (normDbNameEn && normalizeForMatch(mapped.nameEn ?? "") === normDbNameEn)
    return 95;

  // MusicBrainz 최상위 name과 영문 이름 매칭
  if (normDbNameEn && normalizeForMatch(mb.name) === normDbNameEn) return 90;

  // alias에서 매칭
  const aliases = mb.aliases ?? [];
  for (const alias of aliases) {
    const normAlias = normalizeForMatch(alias.name);
    if (normAlias === normDbName) return 85;
    if (normDbNameEn && normAlias === normDbNameEn) return 80;
  }

  // 한국 아티스트 보너스
  if (mb.country === "KR") {
    if (normalizeForMatch(mb.name).includes(normDbName)) return 60;
    if (normDbName.includes(normalizeForMatch(mb.name))) return 55;
  }

  return 0;
}

const MATCH_THRESHOLD = 75;

// --- 메인 ---

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`🔍 아티스트 enrichment 시작 (dryRun=${dryRun})`);

  // musicbrainzId가 없는 아티스트 조회
  const artists = await prisma.artist.findMany({
    where: { musicbrainzId: null },
    orderBy: { createdAt: "asc" },
  });

  console.log(`📦 enrichment 대상: ${artists.length}명\n`);

  let enriched = 0;
  let noMatch = 0;
  let errors = 0;

  for (const artist of artists) {
    try {
      // 한글 이름으로 검색
      let results = await searchArtistByName(artist.name);

      // 결과 없으면 영문 이름으로 재시도
      if (results.length === 0 && artist.nameEn) {
        results = await searchArtistByName(artist.nameEn);
      }

      if (results.length === 0) {
        console.log(`  ❌ ${artist.name} — 검색 결과 없음`);
        noMatch++;
        continue;
      }

      // 가장 높은 점수의 매칭 찾기
      let bestScore = 0;
      let bestMb: MBArtist | null = null;

      for (const mb of results) {
        const score = scoreMatch(artist.name, artist.nameEn, mb);
        if (score > bestScore) {
          bestScore = score;
          bestMb = mb;
        }
      }

      if (!bestMb || bestScore < MATCH_THRESHOLD) {
        console.log(
          `  ⚠️ ${artist.name} — 매칭 점수 부족 (best=${bestScore}, threshold=${MATCH_THRESHOLD})`
        );
        noMatch++;
        continue;
      }

      const mapped = mapArtist(bestMb);

      if (dryRun) {
        console.log(
          `  [DRY] ${artist.name} → ${mapped.name} (${mapped.nameEn ?? "-"}) score=${bestScore}`
        );
        enriched++;
        continue;
      }

      // 기존 aliases와 새 aliases 병합
      const existingAliases = new Set(artist.aliases);
      const newAliases = mapped.aliases.filter((a) => !existingAliases.has(a));

      await prisma.artist.update({
        where: { id: artist.id },
        data: {
          musicbrainzId: mapped.musicbrainzId,
          ...(artist.nameEn ? {} : mapped.nameEn ? { nameEn: mapped.nameEn } : {}),
          aliases: { push: newAliases },
        },
      });

      console.log(
        `  ✅ ${artist.name} → mbId=${mapped.musicbrainzId} (score=${bestScore}, +${newAliases.length} aliases)`
      );
      enriched++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  ❌ ${artist.name} — 에러: ${msg}`);
      errors++;
    }
  }

  console.log("\n✅ Enrichment 완료!");
  console.log(`  성공: ${enriched}`);
  console.log(`  매칭 실패: ${noMatch}`);
  console.log(`  에러: ${errors}`);
}

main()
  .catch((e) => {
    console.error("❌ 에러:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
