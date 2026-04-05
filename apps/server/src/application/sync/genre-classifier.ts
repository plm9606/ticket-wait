import type { PerformanceGenre } from "../../domain/enums.js";

export function classifyGenre(title: string): PerformanceGenre {
  if (/뮤지컬|musical/i.test(title)) return "MUSICAL";

  if (/클래식|오케스트라|교향|orchestra|symphony|리사이틀|recital|가곡|오페라|opera|chamber/i.test(title))
    return "CLASSIC";

  if (/힙합|hiphop|hip-hop|랩|rapper|rap\b|r&b|알앤비/i.test(title))
    return "HIPHOP";

  if (/트롯|트로트|미스터트롯|미스트롯|현역가왕|trot/i.test(title))
    return "TROT";

  if (/페스티벌|festival|페스타|festa|뮤직페스티벌/i.test(title))
    return "FESTIVAL";

  if (/팬미팅|fanmeeting|fan\s*meeting/i.test(title))
    return "FANMEETING";

  return "CONCERT";
}
