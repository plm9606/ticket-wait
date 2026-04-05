import { PrismaClient } from "@prisma/client";
import { normalizeForMatch } from "@concert-alert/shared";
import {
  fetchAllKoreanArtists,
  mapArtist,
} from "../infrastructure/external/musicbrainz.adapter.js";
import { PrismaArtistRepository } from "../infrastructure/persistence/artist.repository.js";
import { ImageEnrichmentAdapter } from "../infrastructure/external/image-enrichment.adapter.js";

const prisma = new PrismaClient();

// --- CLI 옵션 파싱 ---

function parseArgs() {
  const args = process.argv.slice(2);
  let type: "group" | "person" | null = null;
  let limit = 500;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--type" && args[i + 1]) {
      const val = args[i + 1];
      if (val === "group" || val === "person") type = val;
      i++;
    } else if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }
  return { type, limit, dryRun };
}

// --- 기존 아티스트 매칭 ---

async function buildExistingArtistIndex(artistRepo: PrismaArtistRepository) {
  const artists = await artistRepo.findAllForMatching();

  const index = new Map<string, number>(); // normalizedName -> id
  const mbIdSet = new Set<string>(); // 이미 연결된 musicbrainzId

  for (const a of artists) {
    index.set(normalizeForMatch(a.name), a.id);
    if (a.nameEn) index.set(normalizeForMatch(a.nameEn), a.id);
    for (const alias of a.aliases) {
      index.set(normalizeForMatch(alias), a.id);
    }
  }

  return { index, mbIdSet, artists };
}

function findExistingArtistId(
  mapped: ReturnType<typeof mapArtist>,
  index: Map<string, number>
): number | null {
  const byName = index.get(normalizeForMatch(mapped.name));
  if (byName) return byName;

  if (mapped.nameEn) {
    const byEn = index.get(normalizeForMatch(mapped.nameEn));
    if (byEn) return byEn;
  }

  for (const alias of mapped.aliases) {
    const byAlias = index.get(normalizeForMatch(alias));
    if (byAlias) return byAlias;
  }

  return null;
}

// --- 메인 ---

async function main() {
  const { type, limit, dryRun } = parseArgs();

  const artistRepo = new PrismaArtistRepository(prisma);
  const imageEnrichment = new ImageEnrichmentAdapter();

  console.log(
    `🎵 MusicBrainz 시드 시작 (type=${type ?? "all"}, limit=${limit}, dryRun=${dryRun})`
  );

  const { index, mbIdSet } = await buildExistingArtistIndex(artistRepo);
  console.log(`📦 기존 DB 아티스트: ${index.size}개`);

  let totalFetched = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for await (const batch of fetchAllKoreanArtists(type, limit)) {
    for (const mbArtist of batch) {
      totalFetched++;

      if (!mbArtist.type) {
        skipped++;
        continue;
      }

      const mapped = mapArtist(mbArtist);

      if (mbIdSet.has(mapped.musicbrainzId)) {
        skipped++;
        continue;
      }

      if (dryRun) {
        console.log(
          `  [DRY] ${mapped.name} (${mapped.nameEn ?? "-"}) / mbId=${mapped.musicbrainzId} [Apple Music 검색: "${mapped.nameEn ?? mapped.name}"]`
        );
        continue;
      }

      try {
        const imageData = await imageEnrichment.fetchImageData({
          name: mapped.name,
          nameEn: mapped.nameEn,
          aliases: mapped.aliases,
          musicbrainzId: mapped.musicbrainzId,
        });

        const existingId = findExistingArtistId(mapped, index);

        if (existingId) {
          const newAliases = mapped.aliases.filter(
            (a) => !index.has(normalizeForMatch(a))
          );
          await artistRepo.update(existingId, {
            musicbrainzId: mapped.musicbrainzId,
            ...(mapped.nameEn ? { nameEn: mapped.nameEn } : {}),
            ...(imageData.appleMusicId ? { appleMusicId: imageData.appleMusicId } : {}),
            ...(imageData.imageUrl ? { imageUrl: imageData.imageUrl } : {}),
            ...(newAliases.length > 0
              ? { aliases: [...mapped.aliases, ...newAliases] }
              : {}),
          });
          updated++;
          console.log(
            `  ✓ 업데이트: ${mapped.name}${imageData.imageUrl ? " (이미지 저장)" : ""}`
          );
        } else {
          const newArtist = await artistRepo.create({
            name: mapped.name,
            nameEn: mapped.nameEn,
            aliases: mapped.aliases,
            musicbrainzId: mapped.musicbrainzId,
            appleMusicId: imageData.appleMusicId,
            imageUrl: imageData.imageUrl,
          });
          created++;

          index.set(normalizeForMatch(mapped.name), newArtist.id);
          if (mapped.nameEn) index.set(normalizeForMatch(mapped.nameEn), newArtist.id);
          console.log(
            `  + 생성: ${mapped.name}${imageData.imageUrl ? " (이미지 저장)" : ""}`
          );
        }

        mbIdSet.add(mapped.musicbrainzId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`  ✗ ${mapped.name} — 에러: ${msg}`);
        errors++;
      }

      if (totalFetched >= limit) break;
    }

    if (totalFetched >= limit) break;

    console.log(
      `  진행: ${totalFetched}건 (생성=${created}, 업데이트=${updated}, 스킵=${skipped}, 에러=${errors})`
    );
  }

  console.log("\n✅ 완료!");
  console.log(`  총 처리: ${totalFetched}`);
  console.log(`  생성:    ${created}`);
  console.log(`  업데이트: ${updated}`);
  console.log(`  스킵:    ${skipped}`);
  console.log(`  에러:    ${errors}`);
}

main()
  .catch((e) => {
    console.error("❌ 치명적 에러:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
