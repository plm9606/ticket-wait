import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { env } from "../../config/env.js";
import type {
  IKopisPort,
  FacilityDetail,
  FacilitySummary,
  ListFacilitiesParams,
  ListPerformancesParams,
  Mt13,
  PerformanceDetail,
  PerformanceSummary,
  RelateLink,
} from "../../ports/out/kopis.port.js";

export type {
  FacilityDetail,
  FacilitySummary,
  GenreCode,
  IKopisPort,
  ListFacilitiesParams,
  ListPerformancesParams,
  Mt13,
  PerformanceDetail,
  PerformanceState,
  PerformanceSummary,
  RelateLink,
} from "../../ports/out/kopis.port.js";

const BASE_URL = "http://www.kopis.or.kr/openApi/restful";

export class KopisAdapter implements IKopisPort {
  private parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    isArray: (tagName) => ["db", "styurl", "relate", "mt13"].includes(tagName),
  });

  // ─── Internal helpers ──────────────────────────────────────────────────────

  private getServiceKey(): string {
    if (!env.KOPIS_KEY) {
      throw new Error("KOPIS_KEY is not configured");
    }
    return env.KOPIS_KEY;
  }

  private async fetchXml<T>(
    path: string,
    params: Record<string, string | number | undefined>
  ): Promise<T> {
    const cleanParams: Record<string, string> = { service: this.getServiceKey() };
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) cleanParams[key] = String(value);
    }

    const { data } = await axios.get<string>(`${BASE_URL}${path}`, {
      params: cleanParams,
      responseType: "text",
      timeout: 15000,
    });

    const parsed = this.parser.parse(data);
    return parsed.dbs as T;
  }

  private toHttps(url: string): string {
    return url.startsWith("http://") ? "https://" + url.slice(7) : url;
  }

  private normalizeStyurls(raw: unknown): string[] {
    const r = raw as { styurls?: { styurl?: string | string[] } | string };
    if (!r.styurls) return [];
    if (typeof r.styurls === "string") return [r.styurls];
    const inner = r.styurls.styurl;
    if (!inner) return [];
    return Array.isArray(inner) ? inner : [inner];
  }

  private normalizeRelates(raw: unknown): RelateLink[] {
    const r = raw as { relates?: { relate?: RelateLink | RelateLink[] } | string };
    if (!r.relates || typeof r.relates === "string") return [];
    const inner = r.relates.relate;
    if (!inner) return [];
    return Array.isArray(inner) ? inner : [inner];
  }

  private normalizeMt13s(raw: unknown): Mt13[] {
    const r = raw as { mt13s?: { mt13?: Mt13 | Mt13[] } };
    if (!r.mt13s) return [];
    const inner = r.mt13s.mt13;
    if (!inner) return [];
    return Array.isArray(inner) ? inner : [inner];
  }

  // ─── API Methods ──────────────────────────────────────────────────────────

  /**
   * 공연목록 조회 서비스 (GET /pblprfr)
   */
  async listPerformances(params: ListPerformancesParams): Promise<PerformanceSummary[]> {
    const result = await this.fetchXml<{ db?: PerformanceSummary[] }>("/pblprfr", {
      stdate: params.stdate,
      eddate: params.eddate,
      cpage: params.cpage ?? 1,
      rows: params.rows ?? 10,
      shcate: params.shcate,
      shprfnm: params.shprfnm,
      prfstate: params.prfstate,
      afterdate: params.afterdate,
    });
    return (result.db ?? []).map((p) => ({ ...p, poster: this.toHttps(p.poster) }));
  }

  /**
   * 공연 상세 조회 서비스 (GET /pblprfr/{mt20id})
   */
  async getPerformance(mt20id: string): Promise<PerformanceDetail | null> {
    const result = await this.fetchXml<{ db?: PerformanceDetail[] }>(
      `/pblprfr/${mt20id}`,
      {}
    );
    const raw = result.db?.[0];
    if (!raw) return null;

    return {
      ...raw,
      poster: this.toHttps(raw.poster),
      styurls: this.normalizeStyurls(raw),
      relates: this.normalizeRelates(raw),
    };
  }

  /**
   * 공연시설 목록 조회 서비스 (GET /prfplc)
   */
  async listFacilities(params: ListFacilitiesParams): Promise<FacilitySummary[]> {
    const result = await this.fetchXml<{ db?: FacilitySummary[] }>("/prfplc", {
      cpage: params.cpage ?? 1,
      rows: params.rows ?? 10,
      afterdate: params.afterdate,
    });
    return result.db ?? [];
  }

  /**
   * 공연시설 상세 조회 서비스 (GET /prfplc/{mt10id})
   */
  async getFacility(mt10id: string): Promise<FacilityDetail | null> {
    const result = await this.fetchXml<{ db?: FacilityDetail[] }>(
      `/prfplc/${mt10id}`,
      {}
    );
    const raw = result.db?.[0];
    if (!raw) return null;

    return {
      ...raw,
      mt13s: this.normalizeMt13s(raw),
    };
  }
}
