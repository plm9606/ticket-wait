import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppleMusicAdapter } from "../../src/adapters/apple-music.adapter.js";

// ─── axios 모킹 ───────────────────────────────────────────────────────────────

const mockGet = vi.hoisted(() => vi.fn());

vi.mock("axios", () => ({
  default: { get: mockGet },
}));

// ─── 픽스처 ───────────────────────────────────────────────────────────────────

function makeITunesResponse(items: object[] = []) {
  return { data: { resultCount: items.length, results: items } };
}

function makeArtistItem(overrides: Partial<{
  artistName: string;
  artistId: number;
  artistLinkUrl: string;
}> = {}) {
  return {
    wrapperType: "artist",
    artistType: "Artist",
    artistName: "IU",
    artistId: 123456,
    artistLinkUrl: "https://music.apple.com/kr/artist/iu/123456?uo=4",
    primaryGenreName: "K-Pop",
    ...overrides,
  };
}

const BASE_URL = "https://is1-ssl.mzstatic.com/image/thumb/abc/pr_source.png";
const AMI_URL = "https://is1-ssl.mzstatic.com/image/thumb/AMCArtistImages/xyz/ami-identity-abc.png";

// Apple Music 아티스트 페이지 HTML — 원형 아바타 레이아웃
const APPLE_MUSIC_HTML_CIRCULAR = `
<div class="artist-header__circular-artwork-container svelte-xxx">
  <picture>
    <source sizes="190px"
      srcset="${BASE_URL}/190x190cc.webp 190w,${BASE_URL}/380x380cc.webp 380w"
      type="image/webp">
    <source sizes="190px"
      srcset="${BASE_URL}/190x190cc-60.jpg 190w,${BASE_URL}/380x380cc-60.jpg 380w"
      type="image/jpeg">
    <img src="/assets/artwork/1x1.gif" />
  </picture>
</div>
`;

// Apple Music 아티스트 페이지 HTML — 풀블리드 비디오 헤더 레이아웃
const APPLE_MUSIC_HTML_VIDEO = `
<div class="artist-header svelte-xxx artist-header--video"
  style="--background-image: url(${AMI_URL}/2400x933vf-60.jpg); --background-color: #fff;">
  <div class="artwork-container"></div>
</div>
`;

const APPLE_MUSIC_HTML_NO_CONTAINER = `<div class="artist-header other-class">no artwork</div>`;
const APPLE_MUSIC_HTML_NO_SOURCE = `
<div class="artist-header__circular-artwork-container svelte-xxx">
  <picture><img src="/assets/artwork/1x1.gif" /></picture>
</div>
`;

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe("AppleMusicAdapter", () => {
  let adapter: AppleMusicAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new AppleMusicAdapter();
  });

  // ─── searchArtist ─────────────────────────────────────────────────────────

  describe("searchArtist", () => {
    it("nameEn으로 정확 일치하는 아티스트를 반환한다", async () => {
      mockGet.mockResolvedValueOnce(
        makeITunesResponse([makeArtistItem({ artistName: "IU", artistId: 111 })])
      );

      const result = await adapter.searchArtist("아이유", "IU", []);

      expect(result).toEqual({
        appleMusicId: 111,
        name: "IU",
        artistPageUrl: "https://music.apple.com/kr/artist/iu/123456?uo=4",
      });
    });

    it("nameEn이 없으면 name(한글)으로 검색한다", async () => {
      mockGet.mockResolvedValueOnce(
        makeITunesResponse([makeArtistItem({ artistName: "트와이스" })])
      );

      await adapter.searchArtist("트와이스", null, []);

      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({ term: "트와이스" }),
        })
      );
    });

    it("nameEn이 있으면 nameEn으로 검색한다", async () => {
      mockGet.mockResolvedValueOnce(makeITunesResponse([]));

      await adapter.searchArtist("아이유", "IU", []);

      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({ term: "IU" }),
        })
      );
    });

    it("name(한글)과 정확 일치하면 반환한다", async () => {
      mockGet.mockResolvedValueOnce(
        makeITunesResponse([makeArtistItem({ artistName: "트와이스", artistId: 222 })])
      );

      const result = await adapter.searchArtist("트와이스", "TWICE-nonexistent", []);

      // nameEn으로 정확 매칭 실패 → name으로 fallback
      expect(result).toEqual(
        expect.objectContaining({ appleMusicId: 222 })
      );
    });

    it("alias와 정확 일치하면 반환한다", async () => {
      mockGet.mockResolvedValueOnce(
        makeITunesResponse([makeArtistItem({ artistName: "방탄소년단", artistId: 333 })])
      );

      const result = await adapter.searchArtist("방탄소년단", "BTS-alias-fail", ["방탄소년단"]);

      expect(result).toEqual(
        expect.objectContaining({ appleMusicId: 333 })
      );
    });

    it("매칭 실패 시 null을 반환한다", async () => {
      mockGet.mockResolvedValueOnce(
        makeITunesResponse([makeArtistItem({ artistName: "완전히다른아티스트" })])
      );

      const result = await adapter.searchArtist("아이유", "IU", []);

      expect(result).toBeNull();
    });

    it("결과가 없으면 null을 반환한다", async () => {
      mockGet.mockResolvedValueOnce(makeITunesResponse([]));

      const result = await adapter.searchArtist("존재하지않는아티스트", null, []);

      expect(result).toBeNull();
    });

    it("iTunes API 에러 시 에러를 던진다", async () => {
      mockGet.mockRejectedValueOnce(new Error("Network Error"));

      await expect(adapter.searchArtist("아이유", "IU", [])).rejects.toThrow("Network Error");
    });

    it("media=music, country=KR, entity=musicArtist, limit=5 파라미터로 요청한다", async () => {
      mockGet.mockResolvedValueOnce(makeITunesResponse([]));

      await adapter.searchArtist("BTS", null, []);

      expect(mockGet).toHaveBeenCalledWith(
        "https://itunes.apple.com/search",
        expect.objectContaining({
          params: expect.objectContaining({
            media: "music",
            country: "KR",
            entity: "musicArtist",
            limit: 5,
          }),
        })
      );
    });
  });

  // ─── scrapeImageUrl ───────────────────────────────────────────────────────

  describe("scrapeImageUrl", () => {
    it("원형 아바타 레이아웃: JPEG srcset에서 600x600cc.jpg를 반환한다", async () => {
      mockGet.mockResolvedValueOnce({ data: APPLE_MUSIC_HTML_CIRCULAR });

      const url = await adapter.scrapeImageUrl("https://music.apple.com/kr/artist/iu/123");

      expect(url).toBe(`${BASE_URL}/600x600cc.jpg`);
    });

    it("풀블리드 비디오 레이아웃: ami-identity URL에서 600x600bb.jpg를 반환한다", async () => {
      mockGet.mockResolvedValueOnce({ data: APPLE_MUSIC_HTML_VIDEO });

      const url = await adapter.scrapeImageUrl("https://music.apple.com/kr/artist/tvxq/123");

      expect(url).toBe(`${AMI_URL}/600x600bb.jpg`);
    });

    it("원형 아바타가 없고 ami-identity도 없으면 null을 반환한다", async () => {
      mockGet.mockResolvedValueOnce({ data: APPLE_MUSIC_HTML_NO_CONTAINER });

      const url = await adapter.scrapeImageUrl("https://music.apple.com/kr/artist/x/1");

      expect(url).toBeNull();
    });

    it("circular container에 source 태그가 없으면 null을 반환한다", async () => {
      mockGet.mockResolvedValueOnce({ data: APPLE_MUSIC_HTML_NO_SOURCE });

      const url = await adapter.scrapeImageUrl("https://music.apple.com/kr/artist/x/1");

      expect(url).toBeNull();
    });

    it("User-Agent 헤더를 포함해 요청한다", async () => {
      mockGet.mockResolvedValueOnce({ data: APPLE_MUSIC_HTML_CIRCULAR });

      await adapter.scrapeImageUrl("https://music.apple.com/kr/artist/iu/123");

      expect(mockGet).toHaveBeenCalledWith(
        "https://music.apple.com/kr/artist/iu/123",
        expect.objectContaining({
          headers: expect.objectContaining({ "User-Agent": expect.any(String) }),
        })
      );
    });

    it("HTTP 에러 시 에러를 던진다", async () => {
      mockGet.mockRejectedValueOnce(new Error("Request failed with status code 404"));

      await expect(
        adapter.scrapeImageUrl("https://music.apple.com/kr/artist/x/1")
      ).rejects.toThrow("404");
    });
  });

  // ─── extractHighResUrl ────────────────────────────────────────────────────

  describe("extractHighResUrl", () => {
    it("190x190cc-60.jpg → 600x600cc.jpg 로 교체한다", () => {
      const srcset =
        `${BASE_URL}/190x190cc-60.jpg 190w,` +
        `${BASE_URL}/380x380cc-60.jpg 380w`;

      expect(adapter.extractHighResUrl(srcset, "cc")).toBe(`${BASE_URL}/600x600cc.jpg`);
    });

    it("webp URL도 .jpg로 교체한다", () => {
      const srcset =
        `${BASE_URL}/190x190cc.webp 190w,` +
        `${BASE_URL}/380x380cc.webp 380w`;

      expect(adapter.extractHighResUrl(srcset, "cc")).toBe(`${BASE_URL}/600x600cc.jpg`);
    });

    it("suffix bb로 교체한다", () => {
      const srcset = `${BASE_URL}/486x486bb.png 486w`;

      expect(adapter.extractHighResUrl(srcset, "bb")).toBe(`${BASE_URL}/600x600bb.jpg`);
    });

    it("빈 srcset이면 null을 반환한다", () => {
      expect(adapter.extractHighResUrl("", "cc")).toBeNull();
    });
  });
});
