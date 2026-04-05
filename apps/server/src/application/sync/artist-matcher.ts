import { normalizeForMatch, removeConcertSuffixes } from "@concert-alert/shared";
import type { IArtistRepository } from "../../ports/out/artist.port.js";
import type { ArtistMatchData } from "../../domain/artist.entity.js";
import type { IEnrichArtistUseCase } from "../../ports/in/enrich-artist.use-case.js";
import { extractArtistName, NON_ARTIST_PATTERNS } from "./name-extractor.js";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class ArtistMatcher {
  private cachedArtists: ArtistMatchData[] | null = null;

  constructor(
    private artists: IArtistRepository,
    private enrichService?: IEnrichArtistUseCase
  ) {}

  clearCache(): void {
    this.cachedArtists = null;
  }

  private async loadArtists(): Promise<ArtistMatchData[]> {
    if (this.cachedArtists) return this.cachedArtists;
    this.cachedArtists = await this.artists.findAllForMatching();
    return this.cachedArtists;
  }

  /**
   * 공연 제목에서 아티스트를 매칭
   * 우선순위: 한글 이름 → 영문 이름 → 별명 → 접미사 제거 후 재시도
   */
  async matchArtist(artistName: string): Promise<number | null> {
    const artistList = await this.loadArtists();
    const normalizedTitle = normalizeForMatch(artistName);
    const cleanedTitle = normalizeForMatch(removeConcertSuffixes(artistName));

    // 1. 한글 이름 정확 매칭 (긴 이름 우선)
    const sortedByNameLength = [...artistList].sort(
      (a, b) => b.name.length - a.name.length
    );

    for (const artist of sortedByNameLength) {
      const normalizedName = normalizeForMatch(artist.name);
      if (normalizedName.length >= 2 && normalizedTitle.includes(normalizedName)) {
        return artist.id;
      }
    }

    // 2. 영문 이름 매칭 (단어 경계 체크 - 짧은 이름의 오매칭 방지)
    const sortedByEnLength = [...artistList]
      .filter((a) => a.nameEn)
      .sort((a, b) => (b.nameEn?.length || 0) - (a.nameEn?.length || 0));

    for (const artist of sortedByEnLength) {
      if (!artist.nameEn) continue;
      const normalizedEn = normalizeForMatch(artist.nameEn);
      if (normalizedEn.length < 2) continue;

      if (normalizedEn.length <= 4) {
        const regex = new RegExp(
          `(?:^|[\\s\\[\\(\\-])${escapeRegex(artist.nameEn)}(?:$|[\\s\\]\\)\\-'"])`,
          "i"
        );
        if (regex.test(artistName)) return artist.id;
      } else if (normalizedTitle.includes(normalizedEn)) {
        return artist.id;
      }
    }

    // 3. 별명 매칭 (단어 경계 체크)
    for (const artist of artistList) {
      for (const alias of artist.aliases) {
        const normalizedAlias = normalizeForMatch(alias);
        if (normalizedAlias.length < 2) continue;

        if (normalizedAlias.length <= 4) {
          const regex = new RegExp(
            `(?:^|[\\s\\[\\(\\-])${escapeRegex(alias)}(?:$|[\\s\\]\\)\\-'"])`,
            "i"
          );
          if (regex.test(artistName)) return artist.id;
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
   * 매칭 실패 시 아티스트 이름을 추출하여 신규 생성
   * 이미 존재하는 아티스트면 해당 ID 반환
   */
  async matchOrCreate(artistName: string): Promise<number | null> {
    let artistId = await this.matchArtist(artistName);
    if (artistId) return artistId;

    const extracted = extractArtistName(artistName);
    if (!extracted) return null;

    const normalizedExtracted = normalizeForMatch(extracted);
    const artistList = await this.loadArtists();
    const existing = artistList.find(
      (a) => normalizeForMatch(a.name) === normalizedExtracted
    );

    if (existing) return existing.id;

    const isEnglish = /^[a-zA-Z0-9\s\-\.]+$/.test(extracted);
    const newArtist = await this.artists.create({
      name: extracted,
      nameEn: isEnglish ? extracted : null,
      aliases: [],
    });
    artistId = newArtist.id;
    this.clearCache();
    console.log(`[Matcher] Created new artist: ${extracted}`);

    if (this.enrichService) {
      await this.enrichService.enrichOne(newArtist.id);
    }

    return artistId;
  }

  /**
   * DB의 미매칭 공연들에 대해 아티스트 매칭 실행
   */
  async matchUnmatchedPerformances(
    unmatched: Array<{ id: number; title: string }>,
    updateArtist: (id: number, artistId: number) => Promise<void>
  ): Promise<number> {
    this.clearCache();

    let matched = 0;

    for (const perf of unmatched) {
      const artistId = await this.matchOrCreate(perf.title);

      if (artistId) {
        await updateArtist(perf.id, artistId);
        matched++;
      }
    }

    console.log(`[Matcher] ${matched}/${unmatched.length} performances matched`);
    return matched;
  }
}
