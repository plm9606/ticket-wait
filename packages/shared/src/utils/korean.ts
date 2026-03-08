/**
 * 유니코드 NFC 정규화
 */
export function normalizeKorean(text: string): string {
  return text.normalize("NFC");
}

/**
 * 검색/매칭용 텍스트 정규화: 공백 제거, 소문자 변환, NFC 정규화
 */
export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/**
 * 공연 제목에서 아티스트 이름 추출에 방해되는 접미사 제거
 */
const CONCERT_SUFFIXES = [
  "콘서트",
  "공연",
  "단독",
  "앙코르",
  "투어",
  "리사이틀",
  "페스티벌",
  "팬미팅",
  "concert",
  "tour",
  "live",
  "show",
];

export function removeConcertSuffixes(title: string): string {
  let result = title;
  for (const suffix of CONCERT_SUFFIXES) {
    result = result.replace(new RegExp(suffix, "gi"), "");
  }
  return result.trim();
}
