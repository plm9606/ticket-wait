# Concert Alert — 프로젝트 구조 & 컨텍스트

## 개요

Concert Alert는 KOPIS(공연예술통합전산망) API에서 공연 정보를 동기화하여, 구독한 아티스트의 새 공연이 등록되면 푸시 알림을 보내주는 서비스.

핵심 가치: "좋아하는 아티스트의 공연을 놓치지 않게 해준다"

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 모노레포 | pnpm workspaces + Turborepo |
| 프론트엔드 | Next.js 15, React 19, Tailwind CSS 4, Zustand (hooks 기반) |
| 백엔드 | Fastify 5, Prisma 6, PostgreSQL 16 |
| 인증 | 카카오 OAuth → JWT (httpOnly cookie) |
| 푸시 알림 | Firebase Cloud Messaging (FCM) |
| 공연 데이터 | KOPIS API (XML) |
| 아티스트 데이터 | MusicBrainz API (CC0), Apple Music, Wikidata |

---

## 모노레포 파일 맵

```
apps/server/
├── prisma/
│   ├── schema.prisma          # DB 스키마
│   ├── seed.ts                # 개발용 시드
│   └── migrations/
├── src/
│   ├── index.ts               # 서버 엔트리포인트
│   ├── app.ts                 # Fastify 앱 빌드 + 의존성 조립
│   ├── config/env.ts          # 환경변수 검증
│   ├── plugins/auth.ts        # JWT 인증 데코레이터
│   ├── openapi/KOPIS.yml      # KOPIS API 명세
│   ├── domain/                # 순수 엔티티 타입 (Prisma 의존 없음)
│   │   ├── enums.ts           # TicketSource, PerformanceGenre, PerformanceStatus 등
│   │   ├── artist.entity.ts
│   │   ├── performance.entity.ts
│   │   ├── venue.entity.ts
│   │   ├── user.entity.ts
│   │   ├── subscription.entity.ts
│   │   └── notification.entity.ts
│   ├── ports/
│   │   ├── in/                # Primary Port (Application이 외부에 노출하는 인터페이스)
│   │   │   ├── artist.use-case.ts
│   │   │   ├── create-artist.use-case.ts
│   │   │   ├── enrich-artist.use-case.ts
│   │   │   ├── notification.use-case.ts
│   │   │   ├── performance.use-case.ts
│   │   │   └── subscription.use-case.ts
│   │   └── out/               # Secondary Port (Application이 의존하는 외부 인터페이스)
│   │       ├── artist.port.ts
│   │       ├── apple-music.port.ts
│   │       ├── image-enrichment.port.ts
│   │       ├── kakao-auth.port.ts
│   │       ├── kopis.port.ts
│   │       ├── musicbrainz.port.ts
│   │       ├── notification.port.ts
│   │       ├── performance.port.ts
│   │       ├── push-notification.port.ts
│   │       ├── subscription.port.ts
│   │       ├── sync-dlq.port.ts
│   │       ├── sync-log.port.ts
│   │       ├── user.port.ts
│   │       ├── venue.port.ts
│   │       └── wikidata.port.ts
│   ├── application/           # Use Case 구현 (ports/out 인터페이스만 의존)
│   │   ├── artist/
│   │   │   ├── artist.service.ts
│   │   │   ├── create-artist.service.ts
│   │   │   └── enrich-artist.service.ts
│   │   ├── notification/
│   │   │   └── notification.service.ts
│   │   ├── performance/
│   │   │   └── performance.service.ts
│   │   ├── subscription/
│   │   │   └── subscription.service.ts
│   │   └── sync/
│   │       ├── kopis-sync.service.ts  # KOPIS 공연/시설 동기화
│   │       ├── artist-matcher.ts      # 공연명 → 아티스트 매칭 (5단계)
│   │       ├── genre-classifier.ts    # 장르 코드 분류
│   │       ├── name-extractor.ts      # 공연명에서 아티스트 추출
│   │       └── performance-upsert.ts  # Performance 업서트 로직
│   ├── infrastructure/
│   │   ├── persistence/       # Prisma Repository 구현체
│   │   │   ├── prisma.ts
│   │   │   ├── artist.repository.ts
│   │   │   ├── notification.repository.ts
│   │   │   ├── performance.repository.ts
│   │   │   ├── subscription.repository.ts
│   │   │   ├── sync-dlq.repository.ts
│   │   │   ├── sync-log.repository.ts
│   │   │   ├── user.repository.ts
│   │   │   └── venue.repository.ts
│   │   ├── external/          # 외부 API 어댑터
│   │   │   ├── kopis.adapter.ts
│   │   │   ├── kakao.adapter.ts
│   │   │   ├── fcm.adapter.ts
│   │   │   ├── apple-music.adapter.ts
│   │   │   ├── musicbrainz.adapter.ts
│   │   │   ├── wikidata.adapter.ts
│   │   │   └── image-enrichment.adapter.ts
│   │   └── http/              # Fastify 라우트 (Driving Adapter)
│   │       ├── auth/kakao.route.ts
│   │       ├── artists/artist.route.ts
│   │       ├── performances/performance.route.ts
│   │       ├── subscriptions/subscription.route.ts
│   │       └── notifications/notification.route.ts
│   ├── crawlers/
│   │   └── scheduler.ts       # node-cron 스케줄러 (레거시, KOPIS 동기화 트리거)
│   └── scripts/
│       ├── seed-from-musicbrainz.ts  # MusicBrainz에서 아티스트 시딩
│       └── sync-performances.ts      # KOPIS 공연 1회 동기화

apps/web/src/
├── app/                       # Next.js App Router 페이지
│   ├── page.tsx               # 홈
│   ├── layout.tsx
│   ├── search/page.tsx        # 아티스트 검색 (300ms 디바운스)
│   ├── concerts/page.tsx      # 공연 목록 (장르 필터, 커서 페이지네이션)
│   ├── concerts/[id]/page.tsx # 공연 상세
│   ├── artist/[id]/page.tsx   # 아티스트 상세 + 구독
│   ├── my/page.tsx            # 마이페이지 (구독 아티스트)
│   ├── my/notifications/page.tsx  # 알림 목록
│   ├── settings/page.tsx      # 설정
│   └── auth/kakao/callback/page.tsx  # OAuth 콜백
├── components/
│   ├── layout/                # Header, BottomNav, Container, AuthProvider
│   ├── home/                  # SearchBar, CategoryChips, UpcomingForYou, PopularNearYou
│   ├── concert/               # RecentConcerts
│   └── shared/                # EditorialHeadline, PerformanceListCard
├── hooks/                     # useAuth, useSubscriptions, useNotificationCount
└── lib/
    ├── api.ts                 # API fetch 래퍼 (credentials: "include")
    ├── constants.ts
    ├── fcm.ts                 # 클라이언트 FCM
    └── format.ts

packages/shared/src/
├── index.ts
├── types/                     # Artist, Performance, Notification 인터페이스
└── utils/
    ├── korean.ts              # normalizeKorean, normalizeForMatch, removeConcertSuffixes
    └── date.ts
```

---

## DB 스키마 핵심

- **User**: id, kakaoId, nickname, email, profileImage
- **Artist**: id, name, nameEn?, aliases[], imageUrl?, musicbrainzId?(unique), appleMusicId?
- **Venue**: id, name, kopisId(unique), address, lat, lng, seatScale, sido, gugun
- **Performance**: id, title, venueId?, startDate?, endDate?, ticketOpenDate?, source(MELON|YES24|INTERPARK), sourceId, sourceUrl, kopisId?, genre, status — `@@unique([source, sourceId])`
- **PerformanceArtist**: performanceId + artistId (다대다 중간 테이블)
- **Subscription**: userId + artistId (unique pair)
- **Notification**: userId, performanceId, type(NEW_CONCERT|TICKET_OPEN_SOON), sentAt, readAt?
- **SyncLog**: source, startedAt, completedAt?, itemsFound, newItems, updatedItems, status
- **SyncDlq**: kopisId, reason, rawData, resolvedAt?, resolvedArtistId?

> DB에 물리적 FK constraint 없음 (`relationMode = "prisma"`). PK는 모두 `Int @id @default(autoincrement())`.

---

## KOPIS 동기화 파이프라인

`KopisSyncService` (`application/sync/kopis-sync.service.ts`):

```
syncVenues()
  → IKopisPort.listFacilities / getFacility
  → IVenueRepository.upsert()

syncPerformances()
  → IKopisPort.listPerformances / getPerformance
  → ArtistMatcher.resolve() (캐스트명 → 아티스트 ID)
  → upsertPerformances()
  → INotificationUseCase.notifyNewPerformances()
```

**아티스트 매칭** (`application/sync/artist-matcher.ts`):
우선순위: 한글 정확 매칭(NFC, 긴 이름 우선) → 영문 → alias → 접미사 제거 후 재시도 → 이름 추출 → **ICreateArtistUseCase.execute()로 신규 자동 생성**

**신규 아티스트 생성** (`application/artist/create-artist.service.ts`):
MusicBrainz 키워드 검색 → Apple Music 이미지 조회 → Wikidata fallback → Repository 저장

---

## MusicBrainz / 이미지 enrichment 연동

### 어댑터 (`infrastructure/external/musicbrainz.adapter.ts`)

- `searchByKeyword(name, limit?)` — 이름으로 아티스트 검색
- `fetchAllKoreanArtists(type?, maxCount?)` — `area:Korea` 쿼리, AsyncGenerator
- `getArtistWikidataId(mbid)` — MBID → Wikidata ID

### 이미지 enrichment (`infrastructure/external/image-enrichment.adapter.ts`)

1. Apple Music에서 아티스트 검색 → 이미지 스크래핑
2. 실패 시 Wikidata(MBID 경유)에서 이미지 조회

### 이름 매핑 전략
| Artist 필드 | MusicBrainz 소스 |
|---|---|
| `name` (한글) | aliases 중 `locale:"ko"` & `primary:true` → fallback: 아무 ko alias → fallback: 최상위 name |
| `nameEn` (영문) | aliases 중 `locale:"en"` & `primary:true` → fallback: 최상위 name |
| `aliases` | 나머지 모든 alias name (중복 제거) |
| `musicbrainzId` | MusicBrainz MBID (UUID) |

### CLI 스크립트

```bash
# MusicBrainz에서 한국 아티스트 시딩
pnpm seed:musicbrainz [--type group|person] [--limit N] [--dry-run]

# KOPIS 공연 1회 동기화
pnpm sync:performances
```

---

## 인증 플로우

1. 클라이언트 → `/auth/kakao` → 카카오 OAuth
2. 카카오 콜백 → code로 access_token 교환
3. 카카오 프로필 조회 → User upsert → JWT 생성 → httpOnly 쿠키
4. 프론트엔드로 리다이렉트

인증 적용 방식:
- **모듈 전체 보호**: `fastify.addHook("onRequest", fastify.authenticate)` — subscriptions, notifications 라우트
- **개별 라우트 보호**: `{ onRequest: [fastify.authenticate] }` — `GET /performances/feed`, `GET /auth/me`

---

## 프론트엔드 상태 관리

Zustand hooks 3개:
- `useAuth` — user, loading, fetchUser(), logout()
- `useSubscriptions` — subscriptions[], subscribedIds(Set), subscribe(), unsubscribe()
- `useNotificationCount` — count, fetch()

API 호출: `lib/api.ts` 래퍼 (`credentials: "include"` 고정), 전체 커서 기반 페이지네이션

---

## 주요 스크립트

```bash
pnpm dev                    # web(3000) + server(4000) 동시 실행
pnpm db:migrate             # Prisma 마이그레이션
pnpm db:seed                # 개발용 시드
pnpm db:studio              # Prisma Studio
pnpm seed:musicbrainz       # MusicBrainz 아티스트 시딩
pnpm sync:performances      # KOPIS 공연 1회 동기화
```

---

## 코드 컨벤션

- TypeScript strict, ES2022, ESM (`"type": "module"`)
- 헥사고날 아키텍처: `infrastructure → application → ports → domain` 의존성 방향
- Tailwind CSS 인라인, 미니멀/에디토리얼 디자인
- 서버 컴포넌트 우선, `"use client"`는 상태/이벤트 필요 시만
- 커서 기반 페이지네이션 (offset 사용 안 함)
- 커밋 메시지: 한글, `feat:` / `fix:` / `docs:` 등 prefix 사용
