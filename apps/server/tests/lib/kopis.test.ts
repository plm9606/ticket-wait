import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";

vi.mock("axios");
vi.mock("../../src/config/env.js", () => ({
  env: { KOPIS_KEY: "test-service-key" },
}));

const mockedGet = vi.mocked(axios.get);

// XML 픽스처
const PERFORMANCE_LIST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<dbs>
  <db>
    <mt20id>PF001</mt20id>
    <prfnm>테스트 공연</prfnm>
    <prfpdfrom>2026.04.01</prfpdfrom>
    <prfpdto>2026.04.30</prfpdto>
    <fcltynm>테스트 공연장</fcltynm>
    <poster>https://example.com/poster.jpg</poster>
    <area>서울</area>
    <genrenm>뮤지컬</genrenm>
    <openrun>N</openrun>
    <prfstate>공연중</prfstate>
  </db>
</dbs>`;

const PERFORMANCE_DETAIL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<dbs>
  <db>
    <mt20id>PF001</mt20id>
    <prfnm>테스트 공연</prfnm>
    <prfpdfrom>2026.04.01</prfpdfrom>
    <prfpdto>2026.04.30</prfpdto>
    <fcltynm>테스트 공연장</fcltynm>
    <mt10id>FC001</mt10id>
    <prfcast>홍길동, 이순신</prfcast>
    <prfcrew>감독 김철수</prfcrew>
    <prfruntime>120분</prfruntime>
    <prfage>만 7세 이상</prfage>
    <entrpsnmH>주최사</entrpsnmH>
    <entrpsnmS>주관사</entrpsnmS>
    <entrpsnmA>기획사</entrpsnmA>
    <entrpsnmP>제작사</entrpsnmP>
    <pcseguidance>VIP 150,000원, R석 110,000원</pcseguidance>
    <poster>https://example.com/poster.jpg</poster>
    <area>서울</area>
    <genrenm>뮤지컬</genrenm>
    <openrun>N</openrun>
    <prfstate>공연중</prfstate>
    <styurls>
      <styurl>https://example.com/img1.jpg</styurl>
      <styurl>https://example.com/img2.jpg</styurl>
    </styurls>
    <dtguidance>화,수,목,금(19:30) 토(14:00,19:00) 일(14:00)</dtguidance>
    <relates>
      <relate>
        <relatenm>인터파크</relatenm>
        <relateurl>https://tickets.interpark.com/123</relateurl>
      </relate>
      <relate>
        <relatenm>멜론티켓</relatenm>
        <relateurl>https://ticket.melon.com/456</relateurl>
      </relate>
    </relates>
  </db>
</dbs>`;

const PERFORMANCE_DETAIL_SINGLE_RELATE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<dbs>
  <db>
    <mt20id>PF002</mt20id>
    <prfnm>단일 예매처 공연</prfnm>
    <prfpdfrom>2026.05.01</prfpdfrom>
    <prfpdto>2026.05.31</prfpdto>
    <fcltynm>소극장</fcltynm>
    <mt10id>FC002</mt10id>
    <prfcast>배우1</prfcast>
    <prfcrew></prfcrew>
    <prfruntime>90분</prfruntime>
    <prfage>전체관람가</prfage>
    <entrpsnmH></entrpsnmH>
    <entrpsnmS></entrpsnmS>
    <entrpsnmA></entrpsnmA>
    <entrpsnmP></entrpsnmP>
    <pcseguidance>전석 30,000원</pcseguidance>
    <poster></poster>
    <area>경기</area>
    <genrenm>연극</genrenm>
    <openrun>N</openrun>
    <prfstate>공연예정</prfstate>
    <styurls>
      <styurl>https://example.com/single.jpg</styurl>
    </styurls>
    <dtguidance>주말 15:00</dtguidance>
    <relates>
      <relate>
        <relatenm>YES24</relatenm>
        <relateurl>https://ticket.yes24.com/789</relateurl>
      </relate>
    </relates>
  </db>
</dbs>`;

const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<dbs>
</dbs>`;

const FACILITY_LIST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<dbs>
  <db>
    <mt10id>FC001</mt10id>
    <fcltynm>테스트 공연장</fcltynm>
    <opende>2000</opende>
    <seatscale>1000</seatscale>
    <telno>02-1234-5678</telno>
    <relateurl>https://example.com</relateurl>
    <sidonm>서울특별시</sidonm>
    <gugunnm>종로구</gugunnm>
    <fcltychartr>문예회관</fcltychartr>
  </db>
</dbs>`;

const FACILITY_DETAIL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<dbs>
  <db>
    <mt10id>FC001</mt10id>
    <fcltynm>테스트 공연장</fcltynm>
    <opende>2000</opende>
    <seatscale>1000</seatscale>
    <telno>02-1234-5678</telno>
    <relateurl>https://example.com</relateurl>
    <sidonm>서울특별시</sidonm>
    <gugunnm>종로구</gugunnm>
    <fcltychartr>문예회관</fcltychartr>
    <adres>서울특별시 종로구 테스트로 1</adres>
    <la>37.123456</la>
    <lo>126.987654</lo>
    <mt13s>
      <mt13>
        <mt13id>ST001</mt13id>
        <prfplcnm>대극장</prfplcnm>
        <seatscale>800</seatscale>
      </mt13>
      <mt13>
        <mt13id>ST002</mt13id>
        <prfplcnm>소극장</prfplcnm>
        <seatscale>200</seatscale>
      </mt13>
    </mt13s>
  </db>
</dbs>`;

// import는 mock 이후에
const { listPerformances, getPerformance, listFacilities, getFacility } =
  await import("../../src/infrastructure/external/kopis.adapter.js");

describe("kopis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listPerformances", () => {
    it("공연 목록을 반환한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: PERFORMANCE_LIST_XML });

      const result = await listPerformances({
        stdate: "20260401",
        eddate: "20260430",
      });

      expect(result).toHaveLength(1);
      expect(result[0].mt20id).toBe("PF001");
      expect(result[0].prfnm).toBe("테스트 공연");
      expect(result[0].genrenm).toBe("뮤지컬");
    });

    it("service 키를 query param으로 포함한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: PERFORMANCE_LIST_XML });

      await listPerformances({ stdate: "20260401", eddate: "20260430" });

      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringContaining("/pblprfr"),
        expect.objectContaining({
          params: expect.objectContaining({ service: "test-service-key" }),
        })
      );
    });

    it("선택적 파라미터를 query param에 포함한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: PERFORMANCE_LIST_XML });

      await listPerformances({
        stdate: "20260401",
        eddate: "20260430",
        shcate: "GGGA",
        prfstate: "02",
        rows: 50,
      });

      expect(mockedGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            shcate: "GGGA",
            prfstate: "02",
            rows: "50",
          }),
        })
      );
    });

    it("undefined 파라미터는 query param에서 제외한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: PERFORMANCE_LIST_XML });

      await listPerformances({ stdate: "20260401", eddate: "20260430" });

      const params = mockedGet.mock.calls[0][1]?.params as Record<string, string>;
      expect(Object.keys(params)).not.toContain("shcate");
      expect(Object.keys(params)).not.toContain("prfstate");
    });

    it("결과가 없으면 빈 배열을 반환한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: EMPTY_XML });

      const result = await listPerformances({
        stdate: "20260401",
        eddate: "20260430",
      });

      expect(result).toEqual([]);
    });
  });

  describe("getPerformance", () => {
    it("공연 상세를 반환한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: PERFORMANCE_DETAIL_XML });

      const result = await getPerformance("PF001");

      expect(result).not.toBeNull();
      expect(result!.mt20id).toBe("PF001");
      expect(result!.mt10id).toBe("FC001");
      expect(result!.prfcast).toBe("홍길동, 이순신");
    });

    it("소개 이미지 목록을 배열로 정규화한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: PERFORMANCE_DETAIL_XML });

      const result = await getPerformance("PF001");

      expect(result!.styurls).toEqual([
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg",
      ]);
    });

    it("예매 링크 목록을 배열로 정규화한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: PERFORMANCE_DETAIL_XML });

      const result = await getPerformance("PF001");

      expect(result!.relates).toHaveLength(2);
      expect(result!.relates[0]).toEqual({
        relatenm: "인터파크",
        relateurl: "https://tickets.interpark.com/123",
      });
    });

    it("예매처가 하나일 때도 배열로 정규화한다", async () => {
      mockedGet.mockResolvedValueOnce({
        data: PERFORMANCE_DETAIL_SINGLE_RELATE_XML,
      });

      const result = await getPerformance("PF002");

      expect(result!.relates).toHaveLength(1);
      expect(result!.relates[0].relatenm).toBe("YES24");
    });

    it("소개 이미지가 하나일 때도 배열로 정규화한다", async () => {
      mockedGet.mockResolvedValueOnce({
        data: PERFORMANCE_DETAIL_SINGLE_RELATE_XML,
      });

      const result = await getPerformance("PF002");

      expect(result!.styurls).toHaveLength(1);
      expect(result!.styurls[0]).toBe("https://example.com/single.jpg");
    });

    it("결과가 없으면 null을 반환한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: EMPTY_XML });

      const result = await getPerformance("NOTEXIST");

      expect(result).toBeNull();
    });

    it("mt20id를 경로에 포함한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: PERFORMANCE_DETAIL_XML });

      await getPerformance("PF001");

      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringContaining("/pblprfr/PF001"),
        expect.any(Object)
      );
    });
  });

  describe("listFacilities", () => {
    it("공연시설 목록을 반환한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: FACILITY_LIST_XML });

      const result = await listFacilities({});

      expect(result).toHaveLength(1);
      expect(result[0].mt10id).toBe("FC001");
      expect(result[0].fcltynm).toBe("테스트 공연장");
      expect(result[0].sidonm).toBe("서울특별시");
    });

    it("결과가 없으면 빈 배열을 반환한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: EMPTY_XML });

      const result = await listFacilities({});

      expect(result).toEqual([]);
    });
  });

  describe("getFacility", () => {
    it("공연시설 상세를 반환한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: FACILITY_DETAIL_XML });

      const result = await getFacility("FC001");

      expect(result).not.toBeNull();
      expect(result!.mt10id).toBe("FC001");
      expect(result!.adres).toBe("서울특별시 종로구 테스트로 1");
      expect(result!.la).toBe("37.123456");
    });

    it("공연장 목록을 배열로 정규화한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: FACILITY_DETAIL_XML });

      const result = await getFacility("FC001");

      expect(result!.mt13s).toHaveLength(2);
      expect(result!.mt13s[0]).toEqual({
        mt13id: "ST001",
        prfplcnm: "대극장",
        seatscale: "800",
      });
    });

    it("결과가 없으면 null을 반환한다", async () => {
      mockedGet.mockResolvedValueOnce({ data: EMPTY_XML });

      const result = await getFacility("NOTEXIST");

      expect(result).toBeNull();
    });
  });

  describe("인증", () => {
    it("KOPIS_KEY가 없으면 에러를 던진다", async () => {
      vi.doMock("../../src/config/env.js", () => ({
        env: { KOPIS_KEY: "" },
      }));

      // 모듈 캐시를 무효화하여 빈 키로 재로드
      const { listPerformances: freshListPerformances } = await import(
        /* @vite-ignore */ "../../src/infrastructure/external/kopis.adapter.js?nocache=" + Date.now()
      );

      await expect(
        freshListPerformances({ stdate: "20260401", eddate: "20260430" })
      ).rejects.toThrow("KOPIS_KEY is not configured");
    });
  });
});
