/**
 * KOPIS OpenAPI 명세 기반 DTO 타입 및 포트 인터페이스.
 * 명세 변경 시 이 파일을 먼저 수정하고 kopis.adapter.ts의 파싱 로직과 동기화한다.
 */

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
 * 공연상태코드 (01 공연예정, 02 공연중, 03 공연완료)
 */
export type PerformanceState = "01" | "02" | "03";

export interface PerformanceSummary {
  /** 공연 ID */
  mt20id: string;
  /** 공연명 */
  prfnm: string;
  /** 공연 시작일 (YYYY.MM.DD) */
  prfpdfrom: string;
  /** 공연 종료일 (YYYY.MM.DD) */
  prfpdto: string;
  /** 공연시설명 */
  fcltynm: string;
  /** 포스터 이미지 URL */
  poster: string;
  /** 지역 */
  area: string;
  /** 장르명 */
  genrenm: string;
  /** 오픈런 여부 (Y/N) */
  openrun: "Y" | "N";
  /** 공연상태 (공연예정, 공연중, 공연완료) */
  prfstate: string;
}

export interface RelateLink {
  /** 링크명 (예매 사이트명) */
  relatenm: string;
  /** 링크 URL */
  relateurl: string;
}

export interface PerformanceDetail extends PerformanceSummary {
  /** 공연시설 ID */
  mt10id: string;
  /** 출연진 */
  prfcast: string;
  /** 제작진 */
  prfcrew: string;
  /** 공연 런타임 */
  prfruntime: string;
  /** 관람연령 */
  prfage: string;
  /** 주최 */
  entrpsnmH: string;
  /** 주관 */
  entrpsnmS: string;
  /** 기획사 */
  entrpsnmA: string;
  /** 제작사 */
  entrpsnmP: string;
  /** 티켓가격 안내 */
  pcseguidance: string;
  /** 소개 이미지 목록 */
  styurls: string[];
  /** 공연 일시 안내 */
  dtguidance: string;
  /** 관련 링크 목록 */
  relates: RelateLink[];
  /** 줄거리 */
  sty: string;
  /** 내한 여부 (Y/N) */
  visit: "Y" | "N";
  /** 아동공연 여부 (Y/N) */
  child: "Y" | "N";
  /** 대학로 공연 여부 (Y/N) */
  daehakro: "Y" | "N";
  /** 축제 여부 (Y/N) */
  festival: "Y" | "N";
}

export interface FacilitySummary {
  /** 공연시설 ID */
  mt10id: string;
  /** 공연시설명 */
  fcltynm: string;
  /** 개관연도 */
  opende: string;
  /** 좌석수 */
  seatscale: string;
  /** 전화번호 */
  telno: string;
  /** 웹사이트 URL */
  relateurl: string;
  /** 시도명 */
  sidonm: string;
  /** 구군명 */
  gugunnm: string;
  /** 공연시설특성 */
  fcltychartr: string;
}

/** 공연장 (Hall) 정보 */
export interface Mt13 {
  /** 공연장 ID */
  mt13id: string;
  /** 공연장명 */
  prfplcnm: string;
  /** 좌석수 */
  seatscale: string;
}

export interface FacilityDetail extends FacilitySummary {
  /** 주소 */
  adres: string;
  /** 위도 */
  la: string;
  /** 경도 */
  lo: string;
  /** 공연장 목록 */
  mt13s: Mt13[];
}

export interface ListPerformancesParams {
  /** 시작일 (YYYYMMDD) */
  stdate: string;
  /** 종료일 (YYYYMMDD, 최대 31일) */
  eddate: string;
  /** 현재페이지 */
  cpage?: number;
  /** 페이지당 목록 수 (최대 100건) */
  rows?: number;
  /** 장르코드 */
  shcate?: GenreCode;
  /** 공연명 (URLEncoding) */
  shprfnm?: string;
  /** 공연상태코드 (01 공연예정, 02 공연중, 03 공연완료) */
  prfstate?: PerformanceState;
  /** 해당일자 이후 등록/수정된 항목만 출력 (YYYYMMDD) */
  afterdate?: string;
}

export interface ListFacilitiesParams {
  /** 현재페이지 */
  cpage?: number;
  /** 페이지당 목록 수 (최대 100건) */
  rows?: number;
  /** 해당일자 이후 등록/수정된 항목만 출력 (YYYYMMDD) */
  afterdate?: string;
}

export interface IKopisPort {
  listPerformances(params: ListPerformancesParams): Promise<PerformanceSummary[]>;
  getPerformance(mt20id: string): Promise<PerformanceDetail | null>;
  listFacilities(params: ListFacilitiesParams): Promise<FacilitySummary[]>;
  getFacility(mt10id: string): Promise<FacilityDetail | null>;
}
