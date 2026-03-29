import axios, { type AxiosInstance } from "axios";

const BASE_URL = "https://musicbrainz.org/ws/2";
const USER_AGENT = "ConcertAlert/1.0 (https://github.com/concert-alert)";
const MIN_REQUEST_INTERVAL = 1100; // 1.1초 (MusicBrainz 정책: 1req/sec)

// --- Types ---

export interface MBArtist {
  id: string;
  name: string;
  "sort-name": string;
  type: string | null;
  country: string | null;
  disambiguation: string;
  aliases?: MBAlias[];
  score?: number;
}

export interface MBAlias {
  name: string;
  locale: string | null;
  type: string | null;
  primary: boolean | null;
  "sort-name": string;
}

interface MBSearchResponse {
  created: string;
  count: number;
  offset: number;
  artists: MBArtist[];
}

export interface MappedArtist {
  musicbrainzId: string;
  name: string; // 한글 이름
  nameEn: string | null; // 영문 이름
  aliases: string[];
  type: string | null;
}

// --- Rate Limiter ---

let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_INTERVAL - elapsed));
  }
  lastRequestTime = Date.now();
}

// --- HTTP Client ---

function createClient(): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    timeout: 15000,
  });
}

const client = createClient();

// --- API Functions ---

/**
 * MusicBrainz 아티스트 검색 (Lucene 쿼리)
 */
export async function searchArtists(
  query: string,
  limit = 100,
  offset = 0
): Promise<{ artists: MBArtist[]; count: number }> {
  await rateLimit();
  const { data } = await client.get<MBSearchResponse>("/artist", {
    params: { query, fmt: "json", limit, offset },
  });
  return { artists: data.artists, count: data.count };
}

/**
 * 한국 아티스트 검색 (area:Korea, type 지정 가능)
 */
export async function searchKoreanArtists(
  type: "group" | "person" | null = null,
  limit = 100,
  offset = 0
): Promise<{ artists: MBArtist[]; count: number }> {
  let query = "area:Korea";
  if (type) query += ` AND type:${type}`;
  return searchArtists(query, limit, offset);
}

/**
 * 이름으로 아티스트 검색
 */
export async function searchArtistByName(
  name: string,
  limit = 5
): Promise<MBArtist[]> {
  const { artists } = await searchArtists(`"${name}"`, limit);
  return artists;
}

// --- Name Mapping ---

/**
 * MusicBrainz 아티스트 데이터를 우리 Artist 모델 형태로 매핑
 */
export function mapArtist(mb: MBArtist): MappedArtist {
  const aliases = mb.aliases ?? [];

  // 한글 이름: locale=ko 중 primary 우선, 없으면 아무 ko alias
  const koAliases = aliases.filter((a) => a.locale === "ko");
  const primaryKo = koAliases.find((a) => a.primary);
  const koName = primaryKo?.name ?? koAliases[0]?.name ?? null;

  // 영문 이름: locale=en 중 primary 우선, 없으면 최상위 name
  const enAliases = aliases.filter((a) => a.locale === "en");
  const primaryEn = enAliases.find((a) => a.primary);
  const enName = primaryEn?.name ?? enAliases[0]?.name ?? mb.name;

  // name 필드: 한글 이름이 있으면 한글, 없으면 최상위 name
  const name = koName ?? mb.name;

  // nameEn: 영문 이름 (name과 같으면 null)
  const nameEn = enName !== name ? enName : null;

  // aliases: name/nameEn에 사용되지 않은 나머지 alias들
  const usedNames = new Set([name, nameEn, mb.name].filter(Boolean));
  const remainingAliases = aliases
    .map((a) => a.name)
    .filter((n) => !usedNames.has(n));
  const uniqueAliases = [...new Set(remainingAliases)];

  return {
    musicbrainzId: mb.id,
    name,
    nameEn,
    aliases: uniqueAliases,
    type: mb.type,
  };
}

/**
 * 한국 아티스트를 페이지네이션하며 모두 가져오기
 */
export async function* fetchAllKoreanArtists(
  type: "group" | "person" | null = null,
  maxCount?: number
): AsyncGenerator<MBArtist[]> {
  let offset = 0;
  const limit = 100;
  let totalFetched = 0;

  while (true) {
    const { artists, count } = await searchKoreanArtists(type, limit, offset);
    if (artists.length === 0) break;

    yield artists;

    totalFetched += artists.length;
    offset += limit;

    if (maxCount && totalFetched >= maxCount) break;
    if (offset >= count) break;
  }
}
