import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// 순수 함수 테스트 — DB/API 의존성 없는 함수들을 mock 없이 직접 import
vi.mock("../../src/infrastructure/persistence/prisma.js", () => ({
  prisma: {},
}));
vi.mock("../../src/application/sync/genre-classifier.js", () => ({
  classifyGenre: vi.fn((title: string) => {
    if (/페스티벌|festival/i.test(title)) return "FESTIVAL";
    if (/팬미팅|fanmeeting/i.test(title)) return "FANMEETING";
    if (/힙합|hiphop/i.test(title)) return "HIPHOP";
    if (/트로트|trot/i.test(title)) return "TROT";
    return "CONCERT";
  }),
}));
vi.mock("../../src/config/env.js", () => ({
  env: { KOPIS_KEY: "test-key" },
}));

const {
  parseCastNames,
  formatDate,
  buildDateWindows,
  mapGenre,
} = await import("../../src/application/sync/kopis-sync.service.js");

const {
  mapRelateToSource,
  extractSourceId,
  parseKopisDate,
} = await import("../../src/application/sync/performance-upsert.js");

describe("kopis-sync 순수 함수", () => {
  // ─── parseCastNames ──────────────────────────────────────────────────────

  describe("parseCastNames", () => {
    it("쉼표로 구분된 이름을 파싱한다", () => {
      expect(parseCastNames("아이유, 박효신")).toEqual(["아이유", "박효신"]);
    });

    it("전각 쉼표(，)도 구분자로 처리한다", () => {
      expect(parseCastNames("아이유，박효신")).toEqual(["아이유", "박효신"]);
    });

    it("일본식 구분자(、)도 처리한다", () => {
      expect(parseCastNames("아이유、박효신")).toEqual(["아이유", "박효신"]);
    });

    it("null이면 빈 배열을 반환한다", () => {
      expect(parseCastNames(null)).toEqual([]);
    });

    it("undefined면 빈 배열을 반환한다", () => {
      expect(parseCastNames(undefined)).toEqual([]);
    });

    it("빈 문자열이면 빈 배열을 반환한다", () => {
      expect(parseCastNames("")).toEqual([]);
    });

    it("공백만 있으면 빈 배열을 반환한다", () => {
      expect(parseCastNames("   ")).toEqual([]);
    });

    it("이름 앞뒤 공백을 제거한다", () => {
      expect(parseCastNames("  아이유 , 박효신  ,  성시경  ")).toEqual([
        "아이유",
        "박효신",
        "성시경",
      ]);
    });

    it("단일 이름도 배열로 반환한다", () => {
      expect(parseCastNames("아이유")).toEqual(["아이유"]);
    });

    it("마지막 항목의 '등' 접미사를 제거한다", () => {
      expect(parseCastNames("조권, 선예, 민학철 등")).toEqual(["조권", "선예", "민학철"]);
    });

    it("'등' 앞 공백이 없어도 제거한다", () => {
      expect(parseCastNames("조권, 선예등")).toEqual(["조권", "선예"]);
    });
  });

  // ─── mapRelateToSource ───────────────────────────────────────────────────

  describe("mapRelateToSource", () => {
    it("인터파크를 INTERPARK로 매핑한다", () => {
      expect(mapRelateToSource("인터파크")).toBe("INTERPARK");
    });

    it("interpark(영문)을 INTERPARK로 매핑한다", () => {
      expect(mapRelateToSource("Interpark Ticket")).toBe("INTERPARK");
    });

    it("YES24를 YES24로 매핑한다", () => {
      expect(mapRelateToSource("YES24")).toBe("YES24");
    });

    it("yes24 소문자도 매핑한다", () => {
      expect(mapRelateToSource("yes24 티켓")).toBe("YES24");
    });

    it("멜론을 MELON으로 매핑한다", () => {
      expect(mapRelateToSource("멜론티켓")).toBe("MELON");
    });

    it("melon 영문도 매핑한다", () => {
      expect(mapRelateToSource("Melon Ticket")).toBe("MELON");
    });

    it("인식 불가한 예매처는 null을 반환한다", () => {
      expect(mapRelateToSource("네이버")).toBeNull();
    });

    it("빈 문자열은 null을 반환한다", () => {
      expect(mapRelateToSource("")).toBeNull();
    });
  });

  // ─── extractSourceId ─────────────────────────────────────────────────────

  describe("extractSourceId", () => {
    it("인터파크 URL에서 goods ID를 추출한다", () => {
      expect(
        extractSourceId("https://tickets.interpark.com/goods/ABC123", "INTERPARK")
      ).toBe("ABC123");
    });

    it("YES24 URL에서 Perf ID를 추출한다", () => {
      expect(
        extractSourceId("https://ticket.yes24.com/Perf/12345", "YES24")
      ).toBe("12345");
    });

    it("YES24 URL의 대소문자를 무시한다", () => {
      expect(
        extractSourceId("https://ticket.yes24.com/perf/99999", "YES24")
      ).toBe("99999");
    });

    it("멜론 URL에서 prodId를 추출한다", () => {
      expect(
        extractSourceId(
          "https://ticket.melon.com/performance/index.htm?prodId=207483",
          "MELON"
        )
      ).toBe("207483");
    });

    it("파싱 실패 시 URL 전체를 반환한다", () => {
      expect(
        extractSourceId("https://tickets.interpark.com/other/path", "INTERPARK")
      ).toBe("https://tickets.interpark.com/other/path");
    });

    it("유효하지 않은 URL이면 URL 문자열을 그대로 반환한다", () => {
      expect(extractSourceId("not-a-url", "INTERPARK")).toBe("not-a-url");
    });

    it("멜론 URL에 prodId 파라미터가 없으면 URL을 반환한다", () => {
      expect(
        extractSourceId(
          "https://ticket.melon.com/performance/index.htm",
          "MELON"
        )
      ).toBe("https://ticket.melon.com/performance/index.htm");
    });
  });

  // ─── formatDate ──────────────────────────────────────────────────────────

  describe("formatDate", () => {
    it("Date를 YYYYMMDD 형식으로 변환한다", () => {
      expect(formatDate(new Date(2026, 3, 5))).toBe("20260405");
    });

    it("월/일이 한 자리일 때 0으로 패딩한다", () => {
      expect(formatDate(new Date(2026, 0, 1))).toBe("20260101");
    });

    it("12월 31일도 올바르게 변환한다", () => {
      expect(formatDate(new Date(2026, 11, 31))).toBe("20261231");
    });
  });

  // ─── parseKopisDate ──────────────────────────────────────────────────────

  describe("parseKopisDate", () => {
    it("YYYY.MM.DD를 Date로 변환한다", () => {
      const d = parseKopisDate("2026.04.05");
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2026);
      expect(d!.getMonth()).toBe(3); // 0-based
      expect(d!.getDate()).toBe(5);
    });

    it("잘못된 형식이면 null을 반환한다", () => {
      expect(parseKopisDate("2026-04-05")).toBeNull();
    });

    it("빈 문자열이면 null을 반환한다", () => {
      expect(parseKopisDate("")).toBeNull();
    });
  });

  // ─── buildDateWindows ────────────────────────────────────────────────────

  describe("buildDateWindows", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 5)); // 2026-04-05
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("90일 범위를 31일 윈도우로 분할한다", () => {
      const windows = buildDateWindows();
      expect(windows.length).toBeGreaterThanOrEqual(3);
    });

    it("첫 번째 윈도우는 오늘부터 시작한다", () => {
      const windows = buildDateWindows();
      expect(windows[0].stdate).toBe("20260405");
    });

    it("각 윈도우는 최대 31일 범위이다", () => {
      const windows = buildDateWindows();
      for (const w of windows) {
        const st = new Date(
          Number(w.stdate.slice(0, 4)),
          Number(w.stdate.slice(4, 6)) - 1,
          Number(w.stdate.slice(6, 8))
        );
        const ed = new Date(
          Number(w.eddate.slice(0, 4)),
          Number(w.eddate.slice(4, 6)) - 1,
          Number(w.eddate.slice(6, 8))
        );
        const diffDays =
          (ed.getTime() - st.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeLessThanOrEqual(31);
      }
    });

    it("윈도우 간 날짜 갭이 없다 (연속)", () => {
      const windows = buildDateWindows();
      for (let i = 1; i < windows.length; i++) {
        const prevEnd = new Date(
          Number(windows[i - 1].eddate.slice(0, 4)),
          Number(windows[i - 1].eddate.slice(4, 6)) - 1,
          Number(windows[i - 1].eddate.slice(6, 8))
        );
        const currStart = new Date(
          Number(windows[i].stdate.slice(0, 4)),
          Number(windows[i].stdate.slice(4, 6)) - 1,
          Number(windows[i].stdate.slice(6, 8))
        );
        const diffDays =
          (currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBe(1);
      }
    });

    it("마지막 윈도우는 90일 후를 커버한다", () => {
      const windows = buildDateWindows();
      const lastEnd = windows[windows.length - 1].eddate;
      expect(lastEnd).toBe("20260704"); // 4/5 + 90일 = 7/4
    });
  });

  // ─── mapGenre ────────────────────────────────────────────────────────────

  describe("mapGenre", () => {
    it("GGGA(뮤지컬)를 MUSICAL로 매핑한다", () => {
      expect(mapGenre("GGGA", "어떤 공연")).toBe("MUSICAL");
    });

    it("CCCA(클래식)를 CLASSIC으로 매핑한다", () => {
      expect(mapGenre("CCCA", "어떤 공연")).toBe("CLASSIC");
    });

    it("AAAA(연극)를 OTHER로 매핑한다", () => {
      expect(mapGenre("AAAA", "어떤 공연")).toBe("OTHER");
    });

    it("CCCD(대중음악)는 제목 기반으로 세분화한다", () => {
      expect(mapGenre("CCCD", "아이유 콘서트")).toBe("CONCERT");
    });

    it("CCCD + 페스티벌 제목은 FESTIVAL로 분류한다", () => {
      expect(mapGenre("CCCD", "2026 서울재즈페스티벌")).toBe("FESTIVAL");
    });

    it("CCCD + 팬미팅 제목은 FANMEETING으로 분류한다", () => {
      expect(mapGenre("CCCD", "BTS 팬미팅")).toBe("FANMEETING");
    });

    it("알 수 없는 장르코드는 OTHER로 매핑한다", () => {
      expect(mapGenre("ZZZZ" as never, "어떤 공연")).toBe("OTHER");
    });
  });
});
