/**
 * 한국어 날짜 포맷: 2026.03.08 (일)
 */
export function formatDateKo(date: Date): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const day = days[date.getDay()];
  return `${y}.${m}.${d} (${day})`;
}

/**
 * 상대 시간 표시: 방금 전, N분 전, N시간 전, N일 전
 */
export function timeAgoKo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  return formatDateKo(date);
}
