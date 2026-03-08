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

// 공연 제목에서 아티스트 이름을 추출하는 키워드 패턴
const SPLIT_KEYWORDS =
  /전국투어|(?:단독\s*)?(?:콘서트|공연|투어|리사이틀|팬미팅|팬\s*콘서트|페스티벌|뮤직페스티벌|앙코르|내한|쇼케이스)|CONCERT|TOUR|LIVE\s|WORLD|FANMEETING|FAN\s+MEETING|SHOWCASE|IN\s+(?:KOREA|SEOUL|INCHEON|BUSAN)|POP-UP|정규\d|발매|기념|1ST|2ND|3RD|\dTH|\dND|\dRD/i;

// 추출된 이름에서 제거할 후행 노이즈 단어
const TRAILING_NOISE =
  /\s+(?:전국|팬|첫|토크|꽃말|클럽|기획|데뷔|라이브|Piano|THE|ASIA|서울|부산|인천|대구|대전|광주|울산|수원|고양|창원|원주|청주|안양|용인|\d+주년)\s*$/i;

// 아티스트가 아닌 것으로 판별되는 패턴
const NON_ARTIST_PATTERNS = [
  /^전국$/, /^서울$/, /^뮤지컬/, /^각별한$/, /^데이\s*데이$/,
  /^\d/, // 숫자로 시작
  /^[''']/, // 인용부호로 시작
  /^[[\]［］{(（]/, // 괄호로 시작
  /^TOP\d+/i,
  /^제\d+회/, // "제18회 서울재즈" 등
  /페스티벌$/, /FESTIVAL$/i,
  /문화예술|회관|센터|극장/, // 장소명
  /BIRTHDAY/i, /Debut/i,
  /^한국/, // "한국가곡" 등
  /오케스트라/, // "달빛천사 공식 오케스트라" 등
  /과학을 보다/,
];

/**
 * 공연 제목에서 아티스트 이름 추출 시도
 */
export function extractArtistName(title: string): string | null {
  // 괄호/특수 기호 내용 제거
  let cleaned = title
    .replace(/[〈《「【][^〉》」】]*[〉》」】]/g, "")
    .replace(/[［\[][^］\]]*[］\]]/g, "")
    .replace(/[''＂"][^''＂"]*[''＂""]/g, "")
    .replace(/"[^"]*"/g, "") // 일반 쌍따옴표
    .replace(/\s*[-–]\s+(?:서울|부산|인천|대구|대전|광주|울산|수원|고양|창원|원주|청주|안양|용인).*$/g, "")
    .replace(/\s*:\s*.*$/, "")
    .trim();

  // 연도 제거: "2026 아이유" → "아이유", "2025-26 임재범" → "임재범"
  cleaned = cleaned.replace(/^\d{4}(?:-\d{2})?\s+/, "").trim();

  // 키워드 기준으로 앞부분 추출
  const match = cleaned.match(SPLIT_KEYWORDS);
  if (match && match.index && match.index > 0) {
    let name = cleaned.slice(0, match.index).trim();
    // 뒤의 숫자/공백 정리
    name = name.replace(/\s*\d+\s*$/, "").trim();
    // 후행 노이즈 반복 제거
    let prev = "";
    while (prev !== name) {
      prev = name;
      name = name.replace(TRAILING_NOISE, "").trim();
    }
    // 유효성 검증
    if (name.length >= 2 && name.length <= 30) {
      const isNonArtist = NON_ARTIST_PATTERNS.some((p) => p.test(name));
      if (!isNonArtist) {
        return name;
      }
    }
  }

  return null;
}

/**
 * DB의 미매칭 공연들에 대해 아티스트 매칭 실행
 * 매칭 실패 시 제목에서 아티스트 이름을 추출하여 새 아티스트 생성
 */
export async function matchUnmatchedConcerts(): Promise<number> {
  clearArtistCache();

  const unmatched = await prisma.concert.findMany({
    where: { artistId: null },
    select: { id: true, title: true },
  });

  let matched = 0;
  let created = 0;

  for (const concert of unmatched) {
    // 1. 기존 아티스트 매칭 시도
    let artistId = await matchArtist(concert.title);

    // 2. 매칭 실패 시 아티스트 이름 추출 → 새 아티스트 생성
    if (!artistId) {
      const extracted = extractArtistName(concert.title);
      if (extracted) {
        // 같은 이름의 아티스트가 이미 있는지 확인 (정규화 비교)
        const normalizedExtracted = normalizeForMatch(extracted);
        const artists = await loadArtists();
        const existing = artists.find(
          (a) => normalizeForMatch(a.name) === normalizedExtracted
        );

        if (existing) {
          artistId = existing.id;
        } else {
          // 영문/한글 판별
          const isEnglish = /^[a-zA-Z0-9\s\-\.]+$/.test(extracted);
          const newArtist = await prisma.artist.create({
            data: {
              name: extracted,
              nameEn: isEnglish ? extracted : null,
              aliases: [],
            },
          });
          artistId = newArtist.id;
          created++;
          clearArtistCache(); // 새 아티스트 추가됐으므로 캐시 초기화
          console.log(`[Matcher] Created new artist: ${extracted}`);
        }
      }
    }

    if (artistId) {
      await prisma.concert.update({
        where: { id: concert.id },
        data: { artistId },
      });
      matched++;
    }
  }

  console.log(
    `[Matcher] ${matched}/${unmatched.length} concerts matched (${created} new artists created)`
  );
  return matched;
}
