export const GENRE_FILTERS = [
  { value: "", label: "전체" },
  { value: "CONCERT", label: "콘서트" },
  { value: "FESTIVAL", label: "페스티벌" },
  { value: "FANMEETING", label: "팬미팅" },
  { value: "MUSICAL", label: "뮤지컬" },
  { value: "CLASSIC", label: "클래식" },
  { value: "HIPHOP", label: "힙합/R&B" },
  { value: "TROT", label: "트로트" },
  { value: "OTHER", label: "기타" },
] as const;

export function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export function formatDateFull(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function sourceLabel(source: string) {
  switch (source) {
    case "INTERPARK":
      return "인터파크";
    case "YES24":
      return "YES24";
    case "MELON":
      return "멜론티켓";
    default:
      return source;
  }
}

export function genreLabel(genre: string) {
  return GENRE_FILTERS.find((g) => g.value === genre)?.label ?? genre;
}

export function statusLabel(status: string) {
  switch (status) {
    case "UPCOMING":
      return "예정";
    case "ON_SALE":
      return "판매중";
    case "SOLD_OUT":
      return "매진";
    case "COMPLETED":
      return "종료";
    default:
      return status;
  }
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}
