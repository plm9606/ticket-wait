import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { env } from "../../config/env.js";

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

export type PerformanceState = "01" | "02" | "03";

export interface PerformanceSummary {
  mt20id: string;
  prfnm: string;
  prfpdfrom: string;
  prfpdto: string;
  fcltynm: string;
  poster: string;
  area: string;
  genrenm: string;
  openrun: "Y" | "N";
  prfstate: string;
}

export interface RelateLink {
  relatenm: string;
  relateurl: string;
}

export interface PerformanceDetail extends PerformanceSummary {
  mt10id: string;
  prfcast: string;
  prfcrew: string;
  prfruntime: string;
  prfage: string;
  entrpsnmH: string;
  entrpsnmS: string;
  entrpsnmA: string;
  entrpsnmP: string;
  pcseguidance: string;
  styurls: string[];
  dtguidance: string;
  relates: RelateLink[];
}

export interface FacilitySummary {
  mt10id: string;
  fcltynm: string;
  opende: string;
  seatscale: string;
  telno: string;
  relateurl: string;
  sidonm: string;
  gugunnm: string;
  fcltychartr: string;
}

export interface Mt13 {
  mt13id: string;
  prfplcnm: string;
  seatscale: string;
}

export interface FacilityDetail extends FacilitySummary {
  adres: string;
  la: string;
  lo: string;
  mt13s: Mt13[];
}

export interface ListPerformancesParams {
  stdate: string;
  eddate: string;
  cpage?: number;
  rows?: number;
  shcate?: GenreCode;
  shprfnm?: string;
  prfstate?: PerformanceState;
  afterdate?: string;
}

export interface ListFacilitiesParams {
  cpage?: number;
  rows?: number;
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
    prfstate: params.prfstate,
    afterdate: params.afterdate,
  });
  return result.db ?? [];
}

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

export async function listFacilities(
  params: ListFacilitiesParams
): Promise<FacilitySummary[]> {
  const result = await fetchXml<{ db?: FacilitySummary[] }>("/prfplc", {
    cpage: params.cpage ?? 1,
    rows: params.rows ?? 10,
    afterdate: params.afterdate,
  });
  return result.db ?? [];
}

function normalizeMt13s(raw: unknown): Mt13[] {
  const r = raw as { mt13s?: { mt13?: Mt13 | Mt13[] } };
  if (!r.mt13s) return [];
  const inner = r.mt13s.mt13;
  if (!inner) return [];
  return Array.isArray(inner) ? inner : [inner];
}

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
    mt13s: normalizeMt13s(raw),
  };
}
