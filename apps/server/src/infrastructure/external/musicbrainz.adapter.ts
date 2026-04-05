import axios, { type AxiosInstance } from "axios";
import type { IMusicBrainzPort, MBArtist, MBAlias, MappedArtist } from "../../ports/out/musicbrainz.port.js";

export type { MBArtist, MBAlias, MappedArtist } from "../../ports/out/musicbrainz.port.js";

const BASE_URL = "https://musicbrainz.org/ws/2";
const USER_AGENT = "ConcertAlert/1.0 (https://github.com/concert-alert)";
const MIN_REQUEST_INTERVAL = 1100; // 1.1초 (MusicBrainz 정책: 1req/sec)

interface MBSearchResponse {
  created: string;
  count: number;
  offset: number;
  artists: MBArtist[];
}

export class MusicBrainzAdapter implements IMusicBrainzPort {
  private client: AxiosInstance;
  private lastRequestTime = 0;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      timeout: 15000,
    });
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < MIN_REQUEST_INTERVAL) {
      await new Promise((r) => setTimeout(r, MIN_REQUEST_INTERVAL - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private async searchArtists(
    query: string,
    limit = 100,
    offset = 0
  ): Promise<{ artists: MBArtist[]; count: number }> {
    await this.rateLimit();
    const { data } = await this.client.get<MBSearchResponse>("/artist", {
      params: { query, fmt: "json", limit, offset },
    });
    return { artists: data.artists, count: data.count };
  }

  private async searchKoreanArtists(
    type: "group" | "person" | null = null,
    limit = 100,
    offset = 0
  ): Promise<{ artists: MBArtist[]; count: number }> {
    let query = "area:Korea";
    if (type) query += ` AND type:${type}`;
    return this.searchArtists(query, limit, offset);
  }

  async getArtistWikidataId(mbid: string): Promise<string | null> {
    await this.rateLimit();
    const { data } = await this.client.get(`/artist/${mbid}`, {
      params: { inc: "url-rels", fmt: "json" },
    });

    const relations: Array<{ type: string; url?: { resource: string } }> =
      data.relations ?? [];
    const rel = relations.find((r) => r.type === "wikidata");
    if (!rel?.url?.resource) return null;

    const match = rel.url.resource.match(/\/wiki\/(Q\d+)$/);
    return match?.[1] ?? null;
  }

  async *fetchAllKoreanArtists(
    type: "group" | "person" | null = null,
    maxCount?: number
  ): AsyncGenerator<MBArtist[]> {
    let offset = 0;
    const limit = 100;
    let totalFetched = 0;

    while (true) {
      const { artists, count } = await this.searchKoreanArtists(type, limit, offset);
      if (artists.length === 0) break;

      yield artists;

      totalFetched += artists.length;
      offset += limit;

      if (maxCount && totalFetched >= maxCount) break;
      if (offset >= count) break;
    }
  }
}

/**
 * MusicBrainz 아티스트 데이터를 Artist 모델 형태로 매핑 (순수 함수)
 */
export function mapArtist(mb: MBArtist): MappedArtist {
  const aliases = mb.aliases ?? [];

  const koAliases = aliases.filter((a) => a.locale === "ko");
  const primaryKo = koAliases.find((a) => a.primary);
  const koName = primaryKo?.name ?? koAliases[0]?.name ?? null;

  const enAliases = aliases.filter((a) => a.locale === "en");
  const primaryEn = enAliases.find((a) => a.primary);
  const enName = primaryEn?.name ?? enAliases[0]?.name ?? mb.name;

  const name = koName ?? mb.name;
  const nameEn = enName !== name ? enName : null;

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
