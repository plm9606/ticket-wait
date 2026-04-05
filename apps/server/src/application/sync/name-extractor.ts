// 공연 제목에서 아티스트 이름을 추출하는 키워드 패턴
const SPLIT_KEYWORDS =
  /전국투어|(?:단독\s*)?(?:콘서트|공연|투어|리사이틀|팬미팅|팬\s*콘서트|페스티벌|뮤직페스티벌|앙코르|내한|쇼케이스)|CONCERT|TOUR|LIVE\s|WORLD|FANMEETING|FAN\s+MEETING|SHOWCASE|IN\s+(?:KOREA|SEOUL|INCHEON|BUSAN)|POP-UP|정규\d|발매|기념|1ST|2ND|3RD|\dTH|\dND|\dRD/i;

const TRAILING_NOISE =
  /\s+(?:전국|팬|첫|토크|꽃말|클럽|기획|데뷔|라이브|Piano|THE|ASIA|서울|부산|인천|대구|대전|광주|울산|수원|고양|창원|원주|청주|안양|용인|\d+주년)\s*$/i;

export const NON_ARTIST_PATTERNS = [
  /^전국$/, /^서울$/, /^뮤지컬/, /^각별한$/, /^데이\s*데이$/,
  /^\d/,
  /^[''\']/,
  /^[[\]［］{(（]/,
  /^TOP\d+/i,
  /^제\d+회/,
  /페스티벌$/, /FESTIVAL$/i,
  /문화예술|회관|센터|극장/,
  /BIRTHDAY/i, /Debut/i,
  /^한국/,
  /오케스트라/,
  /과학을 보다/,
];

export function extractArtistName(title: string): string | null {
  let cleaned = title
    .replace(/[〈《「【][^〉》」】]*[〉》」】]/g, "")
    .replace(/[［\[][^］\]]*[］\]]/g, "")
    .replace(/[''＂"][^''＂"]*[''＂""]/g, "")
    .replace(/"[^"]*"/g, "")
    .replace(/\s*[-–]\s+(?:서울|부산|인천|대구|대전|광주|울산|수원|고양|창원|원주|청주|안양|용인).*$/g, "")
    .replace(/\s*:\s*.*$/, "")
    .trim();

  cleaned = cleaned.replace(/^\d{4}(?:-\d{2})?\s+/, "").trim();

  const match = cleaned.match(SPLIT_KEYWORDS);
  if (match && match.index && match.index > 0) {
    let name = cleaned.slice(0, match.index).trim();
    name = name.replace(/\s*\d+\s*$/, "").trim();
    let prev = "";
    while (prev !== name) {
      prev = name;
      name = name.replace(TRAILING_NOISE, "").trim();
    }
    if (name.length >= 2 && name.length <= 30) {
      const isNonArtist = NON_ARTIST_PATTERNS.some((p) => p.test(name));
      if (!isNonArtist) {
        return name;
      }
    }
  }

  return null;
}
