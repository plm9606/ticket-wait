# 프론트엔드

## 앱 라우터 구조 (`apps/web/src/app/`)

| 경로 | 설명 |
|------|------|
| `/` | 홈 — 검색바, 장르 필터, 맞춤 추천/인기 공연 |
| `/search` | 아티스트 검색 (300ms 디바운스) |
| `/concerts` | 공연 목록 (장르 필터, 커서 페이지네이션) |
| `/concerts/[id]` | 공연 상세 — 풀폭 히어로, 예매 CTA |
| `/artist/[id]` | 아티스트 상세 + 구독 버튼 |
| `/my` | 마이페이지 (구독 아티스트 그리드) |
| `/my/notifications` | 알림 목록 (예정/지난 알림 그룹) |
| `/settings` | 계정 정보, 푸시 설정, 로그아웃 |
| `/auth/kakao/callback` | 카카오 OAuth 콜백 처리 |
| `/onboarding` | 아티스트 선택 온보딩 |

---

## 상태 관리 (Zustand)

| 스토어 | 파일 | 상태 | 주요 메서드 |
|--------|------|------|------------|
| `useAuth` | `hooks/useAuth.ts` | `user`, `loading` | `fetchUser()`, `logout()` |
| `useSubscriptions` | `hooks/useSubscriptions.ts` | `subscriptions[]`, `subscribedIds (Set)` | `fetch()`, `subscribe()`, `unsubscribe()`, `isSubscribed()` |
| `useNotificationCount` | `hooks/useNotificationCount.ts` | `count` | `fetch()` |

---

## API 호출 패턴

모든 API 호출은 `lib/api.ts` 래퍼 경유:

```typescript
import { api } from "@/lib/api";

const data = await api.get("/artists/search?q=아이유");
await api.post("/subscriptions", { artistId: 42 });
```

- `credentials: "include"` 고정 (JWT 쿠키 자동 전송)
- 기본 URL: `process.env.NEXT_PUBLIC_API_URL`

→ API 엔드포인트 전체 목록: [api.md](api.md)

---

## 컴포넌트 구조

```
src/components/
├── layout/        # Header, BottomNav, Container, AuthProvider
├── home/          # SearchBar, UpcomingForYou, TrendingConcerts
├── concert/       # ConcertCard, RecentConcerts
├── artist/        # 아티스트 관련 컴포넌트
├── alerts/        # ChannelSettings, AlertCard
├── shared/        # EditorialHeadline, PerformanceListCard
└── ui/            # GradientButton, SurfaceCard, Badge, FilterPill, AvatarCircle
```

---

## 핵심 컨벤션

- **서버 컴포넌트 우선** — `"use client"`는 상태/이벤트 필요 시만
- **페이지네이션**: 전체 커서 기반 (offset 없음)
- **에러 처리**: try-catch + 빈 상태/스켈레톤 표시 (UI에서)
- **FCM**: `lib/fcm.ts` — 클라이언트 사이드 FCM 초기화 & 서비스 워커 등록
- **폰트**: Manrope (헤드라인, `font-headline`) + Inter (본문, `font-body`) + Pretendard (한국어 fallback)

---

## 디자인 시스템

→ 토큰/컴포넌트 스펙: [design-system.md](design-system.md)  
→ UI 리뉴얼 계획 (7 Phase): [stitch-design-tech-spec.md](stitch-design-tech-spec.md)
