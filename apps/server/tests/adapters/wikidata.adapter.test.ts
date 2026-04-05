import { describe, it, expect, vi, beforeEach } from "vitest";
import { WikidataAdapter } from "../../src/adapters/wikidata.adapter.js";

// ─── 모킹 ─────────────────────────────────────────────────────────────────────

const mockAxiosGet = vi.hoisted(() => vi.fn());
const mockGetArtistWikidataId = vi.hoisted(() => vi.fn());

vi.mock("axios", () => ({
  default: { get: mockAxiosGet },
}));

vi.mock("../../src/lib/musicbrainz.js", () => ({
  getArtistWikidataId: mockGetArtistWikidataId,
}));

// ─── 픽스처 ───────────────────────────────────────────────────────────────────

function makeWikidataResponse(wikidataId: string, filename: string | null) {
  const claims = filename
    ? {
        P18: [
          {
            mainsnak: {
              snaktype: "value",
              datavalue: { value: filename, type: "string" },
            },
          },
        ],
      }
    : {};

  return {
    data: {
      entities: {
        [wikidataId]: { claims },
      },
    },
  };
}

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe("WikidataAdapter", () => {
  let adapter: WikidataAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new WikidataAdapter();
  });

  // ─── getImageUrl ──────────────────────────────────────────────────────────

  describe("getImageUrl", () => {
    it("P18 파일명으로 Wikimedia Commons URL을 반환한다", async () => {
      const filename = "IU at Cass Point Awards, 6 December 2017.jpg";
      mockAxiosGet.mockResolvedValueOnce(makeWikidataResponse("Q20145", filename));

      const url = await adapter.getImageUrl("Q20145");

      expect(url).toBe(
        `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`
      );
    });

    it("파일명에 한글이 있어도 올바르게 인코딩한다", async () => {
      const filename = "250718 Lee Ji-eun (이지은).png";
      mockAxiosGet.mockResolvedValueOnce(makeWikidataResponse("Q20145", filename));

      const url = await adapter.getImageUrl("Q20145");

      expect(url).toBe(
        `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`
      );
    });

    it("P18 claim이 없으면 null을 반환한다", async () => {
      mockAxiosGet.mockResolvedValueOnce(makeWikidataResponse("Q12345", null));

      const url = await adapter.getImageUrl("Q12345");

      expect(url).toBeNull();
    });

    it("entity가 없으면 null을 반환한다", async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: { entities: {} } });

      const url = await adapter.getImageUrl("Q99999");

      expect(url).toBeNull();
    });

    it("Wikidata API 에러 시 에러를 던진다", async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error("Network Error"));

      await expect(adapter.getImageUrl("Q20145")).rejects.toThrow("Network Error");
    });

    it("올바른 파라미터와 User-Agent로 Wikidata API를 호출한다", async () => {
      mockAxiosGet.mockResolvedValueOnce(makeWikidataResponse("Q20145", null));

      await adapter.getImageUrl("Q20145");

      expect(mockAxiosGet).toHaveBeenCalledWith(
        "https://www.wikidata.org/w/api.php",
        expect.objectContaining({
          params: expect.objectContaining({
            action: "wbgetentities",
            ids: "Q20145",
            props: "claims",
            format: "json",
          }),
          headers: expect.objectContaining({
            "User-Agent": expect.any(String),
          }),
        })
      );
    });
  });

  // ─── getImageUrlByMbid ────────────────────────────────────────────────────

  describe("getImageUrlByMbid", () => {
    it("MBID → Wikidata ID → 이미지 URL 전체 플로우를 처리한다", async () => {
      mockGetArtistWikidataId.mockResolvedValueOnce("Q20145");
      mockAxiosGet.mockResolvedValueOnce(
        makeWikidataResponse("Q20145", "IU singer.jpg")
      );

      const url = await adapter.getImageUrlByMbid("b9545342-1e6d-4dae-84ac-013374ad8d7c");

      expect(url).toBe(
        `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent("IU singer.jpg")}`
      );
    });

    it("Wikidata ID가 없으면 null을 반환한다", async () => {
      mockGetArtistWikidataId.mockResolvedValueOnce(null);

      const url = await adapter.getImageUrlByMbid("some-mbid");

      expect(url).toBeNull();
      expect(mockAxiosGet).not.toHaveBeenCalled();
    });

    it("MusicBrainz 조회 에러 시 에러를 던진다", async () => {
      mockGetArtistWikidataId.mockRejectedValueOnce(new Error("MB API error"));

      await expect(adapter.getImageUrlByMbid("some-mbid")).rejects.toThrow("MB API error");
    });
  });
});
