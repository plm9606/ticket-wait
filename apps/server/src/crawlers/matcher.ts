import { prisma } from "../lib/prisma.js";
import { normalizeForMatch, removeConcertSuffixes } from "@concert-alert/shared";

interface ArtistMatch {
  id: string;
  name: string;
  nameEn: string | null;
  aliases: string[];
}

let cachedArtists: ArtistMatch[] | null = null;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 아티스트 목록을 캐시로 로드
 */
async function loadArtists(): Promise<ArtistMatch[]> {
  if (cachedArtists) return cachedArtists;

  cachedArtists = await prisma.artist.findMany({
    select: { id: true, name: true, nameEn: true, aliases: true },
  });

  return cachedArtists;
}

/**
 * 캐시 초기화 (아티스트 추가 후 호출)
 */
export function clearArtistCache() {
  cachedArtists = null;
}

/**
 * 공연 제목에서 아티스트를 매칭
 * 우선순위: 정확한 이름 → 영문 이름 → 별명 → 정규화 매칭
 */
export async function matchArtist(
  concertTitle: string
): Promise<string | null> {
  const artists = await loadArtists();
  const normalizedTitle = normalizeForMatch(concertTitle);
  const cleanedTitle = normalizeForMatch(removeConcertSuffixes(concertTitle));

  // 1. 한글 이름 정확 매칭 (길이 순 내림차순 - 더 긴 이름 우선)
  const sortedByNameLength = [...artists].sort(
    (a, b) => b.name.length - a.name.length
  );

  for (const artist of sortedByNameLength) {
    const normalizedName = normalizeForMatch(artist.name);
    if (normalizedName.length >= 2 && normalizedTitle.includes(normalizedName)) {
      return artist.id;
    }
  }

  // 2. 영문 이름 매칭 (단어 경계 체크 - 짧은 이름의 오매칭 방지)
  const sortedByEnLength = [...artists]
    .filter((a) => a.nameEn)
    .sort((a, b) => (b.nameEn?.length || 0) - (a.nameEn?.length || 0));

  for (const artist of sortedByEnLength) {
    if (!artist.nameEn) continue;
    const normalizedEn = normalizeForMatch(artist.nameEn);
    if (normalizedEn.length < 2) continue;

    // 영문 이름이 짧은 경우(4자 이하) 단어 경계 체크
    if (normalizedEn.length <= 4) {
      const regex = new RegExp(`(?:^|[\\s\\[\\(\\-])${escapeRegex(artist.nameEn)}(?:$|[\\s\\]\\)\\-'"])`, "i");
      if (regex.test(concertTitle)) {
        return artist.id;
      }
    } else if (normalizedTitle.includes(normalizedEn)) {
      return artist.id;
    }
  }

  // 3. 별명 매칭 (단어 경계 체크)
  for (const artist of artists) {
    for (const alias of artist.aliases) {
      const normalizedAlias = normalizeForMatch(alias);
      if (normalizedAlias.length < 2) continue;

      if (normalizedAlias.length <= 4) {
        const regex = new RegExp(`(?:^|[\\s\\[\\(\\-])${escapeRegex(alias)}(?:$|[\\s\\]\\)\\-'"])`, "i");
        if (regex.test(concertTitle)) {
          return artist.id;
        }
      } else if (normalizedTitle.includes(normalizedAlias)) {
        return artist.id;
      }
    }
  }

  // 4. 접미사 제거 후 재매칭
  if (cleanedTitle !== normalizedTitle) {
    for (const artist of sortedByNameLength) {
      const normalizedName = normalizeForMatch(artist.name);
      if (normalizedName.length >= 2 && cleanedTitle.includes(normalizedName)) {
        return artist.id;
      }
    }
  }

  return null;
}

/**
 * DB의 미매칭 공연들에 대해 아티스트 매칭 실행
 */
export async function matchUnmatchedConcerts(): Promise<number> {
  clearArtistCache();

  const unmatched = await prisma.concert.findMany({
    where: { artistId: null },
    select: { id: true, title: true },
  });

  let matched = 0;

  for (const concert of unmatched) {
    const artistId = await matchArtist(concert.title);
    if (artistId) {
      await prisma.concert.update({
        where: { id: concert.id },
        data: { artistId },
      });
      matched++;
    }
  }

  console.log(
    `[Matcher] ${matched}/${unmatched.length} concerts matched to artists`
  );
  return matched;
}
