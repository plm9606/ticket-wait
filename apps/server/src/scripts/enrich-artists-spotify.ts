import { PrismaClient } from "@prisma/client";
import { normalizeForMatch } from "@concert-alert/shared";
import { SpotifyAdapter } from "../adapters/spotify.adapter.js";

const prisma = new PrismaClient();

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`🎵 Spotify 아티스트 enrichment 시작 (dryRun=${dryRun})`);

  const spotify = new SpotifyAdapter(
    getRequiredEnv("SPOTIFY_CLIENT_ID"),
    getRequiredEnv("SPOTIFY_CLIENT_SECRET")
  );

  const artists = await prisma.artist.findMany({
    where: { spotifyId: null },
    orderBy: { createdAt: "asc" },
  });

  console.log(`📦 대상: ${artists.length}명\n`);

  let enriched = 0;
  let noMatch = 0;
  let errors = 0;

  for (const artist of artists) {
    try {
      const results = await spotify.searchArtist(artist.name);

      if (results.length === 0) {
        console.log(`  ❌ ${artist.name} — 검색 결과 없음`);
        noMatch++;
        continue;
      }

      // 이름 정규화 비교로 가장 근접한 결과 선택
      const normalizedDb = normalizeForMatch(artist.name);
      const normalizedDbEn = artist.nameEn ? normalizeForMatch(artist.nameEn) : null;

      const best = results.find((r) => {
        const normalizedResult = normalizeForMatch(r.name);
        return (
          normalizedResult === normalizedDb ||
          (normalizedDbEn && normalizedResult === normalizedDbEn)
        );
      }) ?? results[0]; // 정확 매칭 없으면 첫 번째 결과

      if (dryRun) {
        console.log(`  [DRY] ${artist.name} → ${best.name} (spotifyId=${best.spotifyId})`);
        enriched++;
        continue;
      }

      await prisma.artist.update({
        where: { id: artist.id },
        data: { spotifyId: best.spotifyId },
      });

      console.log(`  ✅ ${artist.name} → ${best.name} (spotifyId=${best.spotifyId})`);
      enriched++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  ❌ ${artist.name} — 에러: ${msg}`);
      errors++;
    }
  }

  console.log("\n✅ 완료!");
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
