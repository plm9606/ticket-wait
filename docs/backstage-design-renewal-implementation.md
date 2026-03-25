# Backstage 디자인 리뉴얼 — 구현 완료 문서

> 작성일: 2026-03-25
> 상태: 구현 완료 (빌드 성공)

---

## 1. 개요

Stitch MCP에서 디자인한 4개 화면(Home & Explore, Concert Details, Alerts & Settings, 아티스트 선택)을 현재 Next.js 프론트엔드에 적용했다.

**핵심 변경:**
- 앱 이름: "공연알리미" → **"Backstage"**
- 디자인 시스템: "Quiet Luxury" 모노크롬 에디토리얼
- 폰트: Manrope(헤드라인) + Inter(본문) + Pretendard(한국어 fallback)
- 아이콘: 텍스트/이모지 → lucide-react SVG
- 색상: 흰색 배경 → surface 계층 시스템(#f9f9fb/#f3f3f5/#ffffff)
- UI 패턴: border 구분 → surface 색상 차이 구분, glassmorphism 헤더/네비

---

## 2. 디자인 시스템

### 2-1. 색상 토큰 (`globals.css @theme`)

| 토큰 | 값 | 용도 |
|------|------|------|
| `--color-surface` | `#f9f9fb` | body 배경 |
| `--color-surface-low` | `#f3f3f5` | 스켈레톤, 비활성 요소 |
| `--color-surface-lowest` | `#ffffff` | 카드, 입력 필드 배경 |
| `--color-surface-container` | `#eeeef0` | 컨테이너 배경 |
| `--color-surface-dim` | `#d9dadc` | 비활성 토글, 넘버링 |
| `--color-outline` | `#c6c6c6` | 테두리(사용 자제) |
| `--color-on-surface` | `#1a1c1d` | 기본 텍스트 |
| `--color-on-surface-variant` | `#474747` | 보조 텍스트 |

기존 gray 스케일(`gray-50` ~ `gray-900`) 호환성 유지.

### 2-2. 유틸리티 클래스

| 클래스 | 스타일 |
|--------|--------|
| `.btn-primary` | `background: linear-gradient(135deg, #000, #3b3b3b); color: white; border-radius: 0.5rem` |
| `.glass` | `background: rgba(255,255,255,0.8); backdrop-filter: blur(20px)` |

### 2-3. 폰트 전략

- `next/font/google`에서 Manrope, Inter를 CSS variable로 로드 (`--font-manrope`, `--font-inter`)
- `@theme --font-sans`는 Pretendard + 시스템 폰트 유지
- body에서 `font-family: var(--font-inter), var(--font-sans)` 적용
- 헤드라인에 `font-[family-name:var(--font-manrope)]` 인라인 적용

### 2-4. 기존 보존 항목

모든 애니메이션/유틸리티 보존:
- `@keyframes fade-in`, `slide-up`
- `.stagger-1` ~ `.stagger-4`
- `.line-clamp-2`, `.no-select`
- 스크롤바 스타일링, hover transition, img transition

---

## 3. 공통 UI 컴포넌트 (`components/ui/`)

### GradientButton.tsx
- CTA 버튼, `.btn-primary` 적용
- Props: `href?`, `onClick?`, `fullWidth?`, `disabled?`
- `href`가 있으면 `<Link>`, 없으면 `<button>` 렌더링

### SurfaceCard.tsx
- 카드 컨테이너: `bg-surface-lowest rounded-lg p-6`, border 없음
- Props: `children`, `className?`

### Badge.tsx
- 상태 라벨: `rounded-full px-2.5 py-1 text-[11px]`
- Variants: `blue`, `green`, `red`, `gray`, `black`
- 알림에서 색상 허용 (예: 새 공연 = blue, 티켓 오픈 = green, 매진 = red)

### FilterPill.tsx
- 장르 필터 버튼
- active: `bg-black text-white`, inactive: `bg-surface-lowest text-on-surface-variant`

### AvatarCircle.tsx
- 원형 아바타 with Next.js Image
- Sizes: `sm`(32px), `md`(48px), `lg`(64px), `xl`(96px)
- `src` 없으면 이름 이니셜 2글자 fallback

### Toast.tsx + useToast.ts
- Zustand store: `{ message, visible, show(msg, duration?), hide() }`
- 화면 하단 중앙, `animate-slide-up`, 3초 자동 닫힘
- `bg-black text-white rounded-lg`
- `layout.tsx`에 전역으로 마운트

---

## 4. 공유 유틸리티 (`lib/format.ts`)

기존 여러 페이지에 중복되어 있던 함수들을 추출:

| 함수 | 용도 |
|------|------|
| `formatDate(dateStr)` | "3월 25일" 형태 |
| `formatDateFull(dateStr)` | "2026년 3월 25일" 형태 |
| `sourceLabel(source)` | INTERPARK→"인터파크", YES24→"YES24", MELON→"멜론티켓" |
| `genreLabel(genre)` | GENRE_FILTERS에서 매칭 |
| `statusLabel(status)` | UPCOMING→"예정", ON_SALE→"판매중", SOLD_OUT→"매진", COMPLETED→"종료" |
| `timeAgo(dateStr)` | "방금 전", "5분 전", "3시간 전", "2일 전" |
| `GENRE_FILTERS` | 9개 장르 필터 상수 배열 |

---

## 5. 레이아웃 변경

### Header (`components/layout/Header.tsx`)
- **Before**: "공연알리미" 텍스트 로고 + 텍스트 네비(검색, 공연, 알림, MY) + border-b
- **After**: "Backstage" Manrope 로고 + lucide 아이콘(Search, Bell+뱃지, User) + `.glass` 배경

### BottomNav (`components/layout/BottomNav.tsx`)
- **Before**: 이모지 아이콘(⌂, ◎, ♪, ♡) + 탭(홈, 검색, 공연, MY) + border-t
- **After**: lucide 아이콘(Home, Compass, Bell, User) + 탭(홈, 탐색, 알림, 프로필) + `.glass` 배경
- 활성 탭: `strokeWidth={2.5}` + `font-medium`
- 알림 뱃지 dot이 알림 탭으로 이동

---

## 6. 페이지별 변경 상세

### 6-1. 홈 (`/`) — page.tsx 재작성

**Before**: 블랙 히어로 섹션 + "How it works" 3단 + RecentConcerts
**After**:
1. **SearchBar** — fake input, 클릭시 `/search` 이동
2. **FilterPill** 가로 스크롤 — GENRE_FILTERS, TrendingConcerts만 필터링
3. **UpcomingForYou** — 로그인시 `/concerts/feed` 가로 스크롤 카드, 비로그인시 로그인 CTA
4. **TrendingConcerts** — `/concerts?genre=X&limit=10` 넘버링 카드 + "알림 받기" 구독 버튼

**신규 컴포넌트**:
- `components/home/SearchBar.tsx`
- `components/home/UpcomingForYou.tsx`
- `components/home/TrendingConcerts.tsx`
- `components/concert/ConcertCard.tsx` (variant: horizontal/vertical/numbered)

**삭제**: `components/concert/RecentConcerts.tsx`

### 6-2. 검색 (`/search`) — 스타일 수정

- input: `border-b-2 border-black` → `bg-surface-lowest rounded-lg` + `focus:ring-2 focus:ring-black`
- 결과 목록: `divide-y` → `space-y-2` + hover:bg-surface-lowest
- 아바타: 인라인 div → `AvatarCircle` 컴포넌트
- 검색 로직(300ms 디바운스, API) 변경 없음

### 6-3. 공연 상세 (`/concerts/[id]`) — 재작성

**Before**: 가운데 정렬 포스터 + 텍스트 정보 + 예매 링크
**After**:
- **풀폭 히어로**: Container 외부에서 `aspect-[4/3] max-h-[400px]` + 하단 `bg-gradient-to-t from-surface`
- **뒤로가기**: 히어로 좌상단 `ArrowLeft` 버튼 (bg-black/30 backdrop-blur)
- **제목**: Manrope `text-2xl font-bold`
- **메타 정보**: 날짜 · 장소 · "약 120분"
- **Badge**: 상태별 색상 (ON_SALE→green "티켓 판매중", SOLD_OUT→red "매진", UPCOMING→blue "티켓 오픈 예정")
- **CTA**: `GradientButton fullWidth` "예매하기"
- **공연 소개**: `SurfaceCard` (placeholder 정보)
- **아티스트**: `SurfaceCard` + `AvatarCircle size="lg"` + 구독 버튼

**구독 버튼 패턴** (공연 상세, 아티스트 상세 공통):
- 미구독 → `GradientButton("구독하기")`
- 구독중 → `bg-surface-low text-on-surface-variant rounded-lg` 버튼("구독중", 클릭시 해제)
- 비로그인 → `useToast("로그인이 필요합니다")`

### 6-4. 공연 목록 (`/concerts`) — 대폭 수정

- 필터: 인라인 버튼 → `FilterPill` 컴포넌트
- 레이아웃: `space-y-3` 리스트 → `grid grid-cols-2 gap-4` 카드 그리드
- 카드: `ConcertCard variant="vertical"` 사용
- 스켈레톤: `bg-gray-100` → `bg-surface-low`
- "더 보기": border 버튼 → `bg-surface-lowest rounded-lg`

### 6-5. 알림 (`/my/notifications`) — 재작성

**Before**: 단순 알림 리스트 + 읽음/안읽음 dot
**After**:
1. **헤더**: "알림" + "맞춤 알림으로 공연을 놓치지 마세요" 부제
2. **ChannelSettings**: Push 토글(활성) + Email/SMS("준비중") — `SurfaceCard` 내 커스텀 토글
3. **필터 검색바**: 클라이언트사이드 제목/아티스트/장소 필터링
4. **"예정" 섹션**: 읽지 않은 알림 → `AlertCard` (날짜 뱃지 + Badge)
5. **"지난 알림" 섹션**: 읽은 알림 → `AlertCard` (opacity-60)

**신규 컴포넌트**:
- `components/alerts/ChannelSettings.tsx` — SurfaceCard 내 토글 UI
- `components/alerts/AlertCard.tsx` — 날짜 뱃지(월/일) + 공연 정보 + type Badge(새 공연=blue, 티켓 오픈=green)

### 6-6. 프로필 (`/my`) — 수정

- 프로필 아바타: 인라인 div → `AvatarCircle size="xl"` 중앙 정렬
- 로그인 CTA: 카카오 노란색 버튼 → `GradientButton`
- 구독 그리드: 정사각형 이미지 → `AvatarCircle size="lg"` 원형 그리드
- empty state: `border-dashed` → `SurfaceCard`
- 설정 페이지 링크 추가

### 6-7. 설정 (`/settings`) — 수정

- `divide-y` 구분선 → `SurfaceCard` 섹션별 분리 (계정, 알림, 로그아웃)

### 6-8. 아티스트 상세 (`/artist/[id]`) — 수정

- 아바타: 인라인 div → `AvatarCircle size="xl"`
- 공연 목록: border 리스트 → `grid grid-cols-2 gap-4` + `ConcertCard variant="vertical"`
- empty state: `border-dashed` → `SurfaceCard`
- 구독 버튼: 공통 패턴 적용 (GradientButton / surface outline)
- 비로그인: 카카오 링크 → `useToast("로그인이 필요합니다")`

---

## 7. 온보딩 (신규)

### 7-1. 서버 API — `GET /artists`

`apps/server/src/routes/artists/search.ts`에 추가:
- 구독자 수 기준 내림차순 정렬
- `limit` 파라미터 (기본 30, 최대 50)
- 검색어 없이 인기 아티스트 목록 반환

### 7-2. 온보딩 페이지 (`/onboarding`)

- "당신만의 경험을 큐레이팅하세요" 헤더
- 아티스트 검색바 (클라이언트사이드 필터링)
- 3열 `AvatarCircle` 그리드
- 선택 상태: `ring-2 ring-black ring-offset-2` + 체크마크 아이콘
- 하단 고정 CTA: `GradientButton("큐레이팅 완료 → N명 선택")` + `.glass` 배경
- 제출: 선택된 아티스트마다 `POST /subscriptions` 순차 호출 → `/`로 이동

### 7-3. 로그인 후 리다이렉트 변경

`apps/web/src/app/auth/kakao/callback/page.tsx`:
- **Before**: `fetchUser()` → `/my` 이동
- **After**: `fetchUser()` → `GET /subscriptions` 호출 → 0건이면 `/onboarding`, 1건 이상이면 `/`

---

## 8. 수정 파일 총 요약 (32개)

| 액션 | 파일 | Phase |
|------|------|-------|
| 수정 | `apps/web/package.json` | 0 |
| **신규** | `apps/web/src/lib/format.ts` | 0 |
| **삭제** | `apps/web/src/styles/fonts.ts` | 0 |
| 수정 | `apps/web/src/styles/globals.css` | 1 |
| 수정 | `apps/web/src/app/layout.tsx` | 1 |
| 재작성 | `apps/web/src/components/layout/Header.tsx` | 1 |
| 재작성 | `apps/web/src/components/layout/BottomNav.tsx` | 1 |
| **신규** | `apps/web/src/components/ui/Toast.tsx` | 1 |
| **신규** | `apps/web/src/hooks/useToast.ts` | 1 |
| **신규** | `apps/web/src/components/ui/GradientButton.tsx` | 1 |
| **신규** | `apps/web/src/components/ui/SurfaceCard.tsx` | 1 |
| **신규** | `apps/web/src/components/ui/Badge.tsx` | 1 |
| **신규** | `apps/web/src/components/ui/FilterPill.tsx` | 1 |
| **신규** | `apps/web/src/components/ui/AvatarCircle.tsx` | 1 |
| 재작성 | `apps/web/src/app/page.tsx` | 2 |
| **신규** | `apps/web/src/components/home/SearchBar.tsx` | 2 |
| **신규** | `apps/web/src/components/home/UpcomingForYou.tsx` | 2 |
| **신규** | `apps/web/src/components/home/TrendingConcerts.tsx` | 2 |
| **신규** | `apps/web/src/components/concert/ConcertCard.tsx` | 2 |
| **삭제** | `apps/web/src/components/concert/RecentConcerts.tsx` | 2 |
| 수정 | `apps/web/src/app/search/page.tsx` | 2 |
| 재작성 | `apps/web/src/app/concerts/[id]/page.tsx` | 3 |
| 대폭수정 | `apps/web/src/app/concerts/page.tsx` | 4 |
| 재작성 | `apps/web/src/app/my/notifications/page.tsx` | 5 |
| **신규** | `apps/web/src/components/alerts/ChannelSettings.tsx` | 5 |
| **신규** | `apps/web/src/components/alerts/AlertCard.tsx` | 5 |
| 수정 | `apps/web/src/app/my/page.tsx` | 6 |
| 수정 | `apps/web/src/app/settings/page.tsx` | 6 |
| 수정 | `apps/web/src/app/artist/[id]/page.tsx` | 6 |
| 수정 | `apps/server/src/routes/artists/search.ts` | 7 |
| **신규** | `apps/web/src/app/onboarding/page.tsx` | 7 |
| 수정 | `apps/web/src/app/auth/kakao/callback/page.tsx` | 7 |

---

## 9. 주요 기술 결정 사항

| 결정 | 선택 | 이유 |
|------|------|------|
| 네비 라벨 언어 | 한국어 (홈, 탐색, 알림, 프로필) | UI 언어 한국어 유지 원칙 |
| 토스트 구현 | Zustand + CSS (자체 구현) | 외부 의존성 최소화 |
| 홈 필터 범위 | TrendingConcerts만 필터링 | UpcomingForYou는 개인화 피드 |
| 구독 버튼 스타일 | GradientButton(미구독) / surface outline(구독중) | 상태 구분 명확 |
| 비로그인 구독 시도 | Toast "로그인이 필요합니다" | 카카오 페이지 즉시 이동보다 UX 부드러움 |
| RecentConcerts | 삭제 | 홈 리뉴얼 후 미사용 |
| Badge 색상 | 알림에서만 컬러(blue/green/red) 허용 | 모노크롬 원칙 + 알림 가독성 |
| 폰트 로딩 | next/font/google CSS variable | @theme 정적 선언과 충돌 방지 |
| 온보딩 진입 | 로그인 후 구독 0건이면 자동 리다이렉트 | 신규 유저 경험 개선 |

---

## 10. 빌드 검증

```
✓ Compiled successfully in 4.1s
✓ Generating static pages (11/11)

Route (app)                    Size   First Load JS
┌ ○ /                         4.84 kB     110 kB
├ ƒ /artist/[id]              3.85 kB     115 kB
├ ○ /auth/kakao/callback      1.16 kB     103 kB
├ ○ /concerts                 2.59 kB     108 kB
├ ƒ /concerts/[id]            4.83 kB     116 kB
├ ○ /my                       2.55 kB     113 kB
├ ○ /my/notifications         5.07 kB     111 kB
├ ○ /onboarding               3.09 kB     114 kB
├ ○ /search                   1.77 kB     109 kB
└ ○ /settings                 2.08 kB     104 kB
```

전체 11개 라우트 빌드 성공, 타입 에러 없음.

---

## 11. 검증 체크리스트

```bash
pnpm install && pnpm dev
```

- [ ] `/` → 검색바, 필터 pills, 맞춤 추천/인기 공연 섹션
- [ ] `/search` → surface 배경 입력 필드, AvatarCircle 결과
- [ ] `/concerts` → 2열 카드 그리드, FilterPill
- [ ] `/concerts/:id` → 풀폭 히어로, 그라데이션 CTA, SurfaceCard 섹션
- [ ] `/my/notifications` → 채널 설정 토글, 예정/지난 알림 그룹핑
- [ ] `/my` → AvatarCircle 프로필 + 구독 그리드
- [ ] `/settings` → SurfaceCard 섹션
- [ ] `/artist/:id` → AvatarCircle, ConcertCard 그리드, 구독 버튼
- [ ] `/onboarding` → 아티스트 그리드 선택 + 하단 CTA
- [ ] Header: "Backstage" 로고 + 아이콘 네비 + glassmorphism
- [ ] BottomNav: lucide 아이콘 + 한국어 라벨 + glassmorphism
- [ ] 모바일 390px 뷰포트 레이아웃
- [ ] 비로그인 → 구독 시도 시 Toast 표시
