import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { env } from "../config/env.js";

const BASE_URL = "http://www.kopis.or.kr/openApi/restful";

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  isArray: (tagName) => ["db", "styurl", "relate", "mt13"].includes(tagName),
});

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * 장르코드
 * AAAA 연극 | BBBC 무용 | BBBE 대중무용 | CCCA 클래식 | CCCC 국악 |
 * CCCD 대중음악 | EEEA 복합 | EEEB 서커스/마술 | GGGA 뮤지컬
 */
export type GenreCode =
  | "AAAA"
  | "BBBC"
  | "BBBE"
  | "CCCA"
  | "CCCC"
  | "CCCD"
  | "EEEA"
  | "EEEB"
  | "GGGA";

/**
 * 공연상태코드
 * "01" 공연예정 | "02" 공연중 | "03" 공연완료
 */
export type PerformanceState = "01" | "02" | "03";

export interface PerformanceSummary {
  /**
   * 공연 ID
   */
  mt20id: string;
  /**
   * 공연명
   */
  prfnm: string;
  /**
   * 공연 시작일 (YYYY.MM.DD)
   */
  prfpdfrom: string;
  /**
   * 공연 종료일 (YYYY.MM.DD)
   */
  prfpdto: string;
  /**
   * 공연시설명
   */
  fcltynm: string;
  /**
   * 포스터 이미지 URL
   */
  poster: string;
  /**
   * 지역
   */
  area: string;
  /**
   * 장르명
   */
  genrenm: string;
  /**
   * 오픈런 여부
   */
  openrun: "Y" | "N";
  /**
   * 공연상태 (공연예정 | 공연중 | 공연완료)
   */
  prfstate: string;
}

export interface RelateLink {
  /**
   * 예매 사이트명
   */
  relatenm: string;
  /**
   * 예매 URL
   */
  relateurl: string;
}

export interface PerformanceDetail extends PerformanceSummary {
  /**
   * 공연시설 ID
   */
  mt10id: string;
  /**
   * 출연진
   */
  prfcast: string;
  /**
   * 제작진
   */
  prfcrew: string;
  /**
   * 공연 런타임
   */
  prfruntime: string;
  /**
   * 관람연령
   */
  prfage: string;
  /**
   * 주최
   */
  entrpsnmH: string;
  /**
   * 주관
   */
  entrpsnmS: string;
  /**
   * 기획사
   */
  entrpsnmA: string;
  /**
   * 제작사
   */
  entrpsnmP: string;
  /**
   * 티켓가격 안내
   */
  pcseguidance: string;
  /**
   * 소개 이미지 URL 목록
   */
  styurls: string[];
  /**
   * 공연 일시 안내
   */
  dtguidance: string;
  /**
   * 예매 링크 목록
   */
  relates: RelateLink[];
}

export interface FacilitySummary {
  /**
   * 공연시설 ID
   */
  mt10id: string;
  /**
   * 공연시설명
   */
  fcltynm: string;
  /**
   * 개관연도
   */
  opende: string;
  /**
   * 좌석수
   */
  seatscale: string;
  /**
   * 전화번호
   */
  telno: string;
  /**
   * 웹사이트 URL
   */
  relateurl: string;
  /**
   * 시도명
   */
  sidonm: string;
  /**
   * 구군명
   */
  gugunnm: string;
  /**
   * 공연시설특성
   */
  fcltychartr: string;
}

export interface Hall {
  /**
   * 공연장 ID
   */
  mt13id: string;
  /**
   * 공연장명
   */
  prfplcnm: string;
  /**
   * 좌석수
   */
  seatscale: string;
}

export interface FacilityDetail extends FacilitySummary {
  /**
   * 주소
   */
  adres: string;
  /**
   * 위도
   */
  la: string;
  /**
   * 경도
   */
  lo: string;
  /**
   * 공연장 목록
   */
  mt13s: Hall[];
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface ListPerformancesParams {
  /**
   * 시작일 (YYYYMMDD)
   */
  stdate: string;
  /**
   * 종료일 (YYYYMMDD, 최대 31일 범위)
   */
  eddate: string;
  /**
   * 현재 페이지 (기본값 1)
   */
  cpage?: number;
  /**
   * 페이지당 목록 수 (기본값 10, 최대 100)
   */
  rows?: number;
  /**
   * 장르코드
   */
  shcate?: GenreCode;
  /**
   * 공연명 검색 (URLEncoding)
   */
  shprfnm?: string;
  /**
   * 공연시설명 검색 (URLEncoding)
   */
  shprfnmfct?: string;
  /**
   * 공연장코드
   */
  prfplccd?: string;
  /**
   * 지역(시도)코드
   */
  signgucode?: string;
  /**
   * 지역(구군)코드
   */
  signgucodesub?: string;
  /**
   * 아동공연여부
   */
  kidstate?: "Y" | "N";
  /**
   * 공연상태코드
   */
  prfstate?: PerformanceState;
  /**
   * 오픈런 여부 (Y만 허용)
   */
  openrun?: "Y";
  /**
   * 해당일자 이후 등록/수정된 항목만 출력 (YYYYMMDD)
   */
  afterdate?: string;
}

export interface ListFacilitiesParams {
  /**
   * 현재 페이지 (기본값 1)
   */
  cpage?: number;
  /**
   * 페이지당 목록 수 (기본값 10, 최대 100)
   */
  rows?: number;
  /**
   * 공연시설명 검색 (URLEncoding)
   */
  shprfnmfct?: string;
  /**
   * 공연시설특성코드
   * 1 중앙정부 | 2 문예회관 | 3 기타(공공) | 4 대학로 | 5 민간(대학로 외) | 6 기타(해외등) | 7 기타(비공연장)
   */
  fcltychartr?: "1" | "2" | "3" | "4" | "5" | "6" | "7";
  /**
   * 지역(시도)코드
   */
  signgucode?: string;
  /**
   * 지역(구군)코드
   */
  signgucodesub?: string;
  /**
   * 해당일자 이후 등록/수정된 항목만 출력 (YYYYMMDD)
   */
  afterdate?: string;
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

function getServiceKey(): string {
  if (!env.KOPIS_SERVICE_KEY) {
    throw new Error("KOPIS_SERVICE_KEY is not configured");
  }
  return env.KOPIS_SERVICE_KEY;
}

async function fetchXml<T>(
  path: string,
  params: Record<string, string | number | undefined>
): Promise<T> {
  const cleanParams: Record<string, string> = { service: getServiceKey() };
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) cleanParams[key] = String(value);
  }

  const { data } = await axios.get<string>(`${BASE_URL}${path}`, {
    params: cleanParams,
    responseType: "text",
    timeout: 15000,
  });

  const parsed = parser.parse(data);
  return parsed.dbs as T;
}

function normalizeStyurls(raw: unknown): string[] {
  const r = raw as { styurls?: { styurl?: string | string[] } | string };
  if (!r.styurls) return [];
  if (typeof r.styurls === "string") return [r.styurls];
  const inner = r.styurls.styurl;
  if (!inner) return [];
  return Array.isArray(inner) ? inner : [inner];
}

function normalizeRelates(raw: unknown): RelateLink[] {
  const r = raw as { relates?: { relate?: RelateLink | RelateLink[] } | string };
  if (!r.relates || typeof r.relates === "string") return [];
  const inner = r.relates.relate;
  if (!inner) return [];
  return Array.isArray(inner) ? inner : [inner];
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * 공연목록 조회 (GET /pblprfr)
 */
export async function listPerformances(
  params: ListPerformancesParams
): Promise<PerformanceSummary[]> {
  const result = await fetchXml<{ db?: PerformanceSummary[] }>("/pblprfr", {
    stdate: params.stdate,
    eddate: params.eddate,
    cpage: params.cpage ?? 1,
    rows: params.rows ?? 10,
    shcate: params.shcate,
    shprfnm: params.shprfnm,
    shprfnmfct: params.shprfnmfct,
    prfplccd: params.prfplccd,
    signgucode: params.signgucode,
    signgucodesub: params.signgucodesub,
    kidstate: params.kidstate,
    prfstate: params.prfstate,
    openrun: params.openrun,
    afterdate: params.afterdate,
  });
  return result.db ?? [];
}

/**
 * 공연 상세 조회 (GET /pblprfr/{mt20id})
 */
export async function getPerformance(
  mt20id: string
): Promise<PerformanceDetail | null> {
  const result = await fetchXml<{ db?: PerformanceDetail[] }>(
    `/pblprfr/${mt20id}`,
    {}
  );
  const raw = result.db?.[0];
  if (!raw) return null;

  return {
    ...raw,
    styurls: normalizeStyurls(raw),
    relates: normalizeRelates(raw),
  };
}

/**
 * 공연시설 목록 조회 (GET /prfplc)
 */
export async function listFacilities(
  params: ListFacilitiesParams
): Promise<FacilitySummary[]> {
  const result = await fetchXml<{ db?: FacilitySummary[] }>("/prfplc", {
    cpage: params.cpage ?? 1,
    rows: params.rows ?? 10,
    shprfnmfct: params.shprfnmfct,
    fcltychartr: params.fcltychartr,
    signgucode: params.signgucode,
    signgucodesub: params.signgucodesub,
    afterdate: params.afterdate,
  });
  return result.db ?? [];
}

/**
 * 공연시설 상세 조회 (GET /prfplc/{mt10id})
 */
export async function getFacility(
  mt10id: string
): Promise<FacilityDetail | null> {
  const result = await fetchXml<{ db?: FacilityDetail[] }>(
    `/prfplc/${mt10id}`,
    {}
  );
  const raw = result.db?.[0];
  if (!raw) return null;

  return {
    ...raw,
    mt13s: (raw as unknown as { mt13s?: { mt13?: Hall[] } }).mt13s?.mt13 ?? [],
  };
}
