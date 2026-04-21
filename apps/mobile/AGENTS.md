# apps/mobile

Expo 55 (React Native) 모바일 앱.

## 구조

```
src/
├── app/           # Expo Router 네비게이션 (스택/탭)
├── components/    # layout/, home/, concert/, artist/, ui/
├── hooks/         # API 호출 & 상태 관리 (웹과 동일 패턴)
├── lib/           # API 클라이언트
└── theme/         # 모바일 테마 (Pretendard 폰트)
```

## 웹과의 주요 차이점

| 항목 | 웹 | 모바일 |
|------|----|----|
| 폰트 | Manrope + Inter | Pretendard |
| OAuth 콜백 | 쿠키 | `concertalert://auth/callback?token=<jwt>` 딥링크 |
| 푸시 알림 | Web Push (FCM) | Expo Notifications + FCM |

## 심층 문서

→ [docs/frontend.md](../../docs/frontend.md) — API 패턴, 상태 관리 공통  
→ [docs/auth.md](../../docs/auth.md) — 모바일 딥링크 인증
