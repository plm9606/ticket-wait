// 개발 환경에서는 로컬 주소 사용
// 프로덕션 배포 시 실제 URL로 교체
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000";
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

// WebView에서 허용할 URL 패턴 (이 외의 URL은 시스템 브라우저로 열림)
export const ALLOWED_HOSTS = [
  new URL(WEB_URL).host,
  new URL(API_URL).host,
  "kauth.kakao.com",
  "accounts.kakao.com",
];
