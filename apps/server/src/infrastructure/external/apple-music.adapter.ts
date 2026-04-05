import axios from "axios";
import { load } from "cheerio";
import { normalizeForMatch } from "@concert-alert/shared";
import type { IAppleMusicPort, AppleMusicArtist } from "../../ports/out/apple-music.port.js";

export type { AppleMusicArtist } from "../../ports/out/apple-music.port.js";

// ─── iTunes Search API 타입 ────────────────────────────────────────────────────

interface ITunesArtistResult {
  wrapperType: "artist";
  artistType: string;
  artistName: string;
  artistLinkUrl: string;
  artistId: number;
}

interface ITunesSearchResponse {
  resultCount: number;
  results: ITunesArtistResult[];
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

const ITUNES_URL = "https://itunes.apple.com/search";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export class AppleMusicAdapter implements IAppleMusicPort {
  // ─── iTunes 아티스트 검색 ──────────────────────────────────────────────────

  async searchArtist(
    name: string,
    nameEn: string | null,
    aliases: string[]
  ): Promise<AppleMusicArtist | null> {
    const query = nameEn ?? name;
    const { data } = await axios.get<ITunesSearchResponse>(ITUNES_URL, {
      params: { media: "music", country: "KR", term: query, entity: "musicArtist", limit: 5 },
      timeout: 10000,
    });

    return this.findBestMatch(data.results, name, nameEn, aliases);
  }

  private findBestMatch(
    results: ITunesArtistResult[],
    name: string,
    nameEn: string | null,
    aliases: string[]
  ): AppleMusicArtist | null {
    const query = nameEn ?? name;
    const normalizedQuery = normalizeForMatch(query);

    // 1. 검색 쿼리와 정확 일치
    const exact = results.find(
      (r) => normalizeForMatch(r.artistName) === normalizedQuery
    );
    if (exact) return this.toArtist(exact);

    // 2. name(한글)과 정확 일치
    if (nameEn) {
      const byKo = results.find(
        (r) => normalizeForMatch(r.artistName) === normalizeForMatch(name)
      );
      if (byKo) return this.toArtist(byKo);
    }

    // 3. aliases 중 일치
    for (const alias of aliases) {
      const byAlias = results.find(
        (r) => normalizeForMatch(r.artistName) === normalizeForMatch(alias)
      );
      if (byAlias) return this.toArtist(byAlias);
    }

    return null;
  }

  private toArtist(result: ITunesArtistResult): AppleMusicArtist {
    return {
      appleMusicId: result.artistId,
      name: result.artistName,
      artistPageUrl: result.artistLinkUrl,
    };
  }

  // ─── Apple Music 아티스트 페이지에서 이미지 스크래핑 ──────────────────────
  //
  // 두 가지 레이아웃 지원:
  //   1. 원형 아바타 (artist-header__circular-artwork-container)
  //      → JPEG srcset에서 가장 큰 URL 추출, 600x600으로 교체
  //   2. 풀블리드 비디오 헤더 (artist-header--video)
  //      → --background-image CSS 변수에서 ami-identity URL 추출, 600x600bb로 교체

  async scrapeImageUrl(artistPageUrl: string): Promise<string | null> {
    const { data: html } = await axios.get<string>(artistPageUrl, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 10000,
    });

    const $ = load(html);

    // 전략 1: 원형 아바타 컨테이너
    const container = $(".artist-header__circular-artwork-container");
    if (container.length) {
      const jpegSrcset = container.find('source[type="image/jpeg"]').first().attr("srcset");
      const srcset = jpegSrcset ?? container.find("source").first().attr("srcset");
      if (srcset) return this.extractHighResUrl(srcset, "cc");
    }

    // 전략 2: --background-image 스타일에서 ami-identity URL 추출
    const headerStyle = $(".artist-header").first().attr("style") ?? "";
    const amiMatch = headerStyle.match(
      /url\((https:\/\/is\d+-ssl\.mzstatic\.com\/image\/thumb\/[^)]+\/ami-identity[^)]+)\)/
    );
    if (amiMatch) {
      // 사이즈 부분 제거 후 600x600bb.jpg 로 교체
      const baseUrl = amiMatch[1].replace(/\/\d+x\d+[^/]+$/, "");
      return `${baseUrl}/600x600bb.jpg`;
    }

    return null;
  }

  // srcset에서 가장 큰 URL을 추출하고 600x600으로 교체
  // suffix: "cc" (crop-center) | "bb" (bounding-box)
  extractHighResUrl(srcset: string, suffix: "cc" | "bb" = "cc"): string | null {
    const parts = srcset.split(",").map((s) => s.trim());
    const last = parts[parts.length - 1];
    const url = last?.split(" ")[0];
    if (!url) return null;

    // /190x190cc-60.jpg, /380x380cc.webp, /486x486bb.png 등 → /600x600{suffix}.jpg
    return url.replace(/\/\d+x\d+\w+(?:-\d+)?\.(?:jpg|jpeg|webp|png)$/, `/600x600${suffix}.jpg`);
  }
}
