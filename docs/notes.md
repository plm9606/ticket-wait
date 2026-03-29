# Concert Alert — 프로젝트 구조 & 컨텍스트

## 개요

Concert Alert는 멜론티켓·YES24·인터파크의 공연 정보를 자동 수집하여, 구독한 아티스트의 새 공연이 등록되면 푸시 알림을 보내주는 서비스.

핵심 가치: "좋아하는 아티스트의 공연을 놓치지 않게 해준다"

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 모노레포 | pnpm workspaces + Turborepo |
| 프론트엔드 | Next.js 15, React 19, Tailwind CSS 4, Zustand (hooks 기반) |
| 백엔드 | Fastify 5, Prisma 6, PostgreSQL 16 |
| 크롤러 | cheerio + axios + node-cron |
| 인증 | 카카오 OAuth → JWT (httpOnly cookie) |
| 푸시 알림 | Firebase Cloud Messaging (FCM) |
| 아티스트 데이터 | MusicBrainz API (CC0, 상업적 사용 가능) |

---

## 모노레포 파일 맵

```
apps/server/
├── prisma/
│   ├── schema.prisma          # DB 스키마 (User, Artist, Concert, Subscription, FcmToken, Notification, CrawlLog)
│   ├── seed.ts                # 개발용 시드 (124 아티스트 하드코딩 + 샘플 공연)
│   └── migrations/
├── src/
│   ├── index.ts               # 서버 엔트리포인트
│   ├── app.ts                 # Fastify 앱 빌드 (플러그인, 라우트 등록)
│   ├── config/env.ts          # 환경변수
│   ├── plugins/auth.ts        # JWT 인증 데코레이터 (fastify.authenticate)
│   ├── lib/
│   │   ├── prisma.ts          # PrismaClient 싱글턴
│   │   ├── kakao.ts           # 카카오 OAuth API
│   │   ├── fcm.ts             # Firebase Cloud Messaging
│   │   └── musicbrainz.ts     # MusicBrainz API 클라이언트 (rate limiter, 검색, 이름 매핑)
│   ├── routes/
│   │   ├── auth/kakao.ts      # /auth/kakao, /auth/kakao/callback, /auth/logout, /auth/me
│   │   ├── artists/search.ts  # /artists/search, /artists, /artists/:id
│   │   ├── concerts/index.ts  # /concerts, /concerts/:id, /artists/:id/concerts, /concerts/feed
│   │   ├── subscriptions/index.ts  # /subscriptions CRUD, /subscriptions/check/:artistId
│   │   └── notifications/index.ts  # /notifications/*, FCM 토큰 등록
│   ├── services/
│   │   └── notification.service.ts  # 알림 생성 + FCM 발송
│   ├── crawlers/
│   │   ├── base.crawler.ts    # 추상 클래스: fetchWithRetry, 재시도(3회), 딜레이(3초)
│   │   ├── interpark.crawler.ts  # 인터파크 JSON API
│   │   ├── yes24.crawler.ts   # YES24 AJAX
│   │   ├── melon.crawler.ts   # 멜론 HTML (cheerio)
│   │   ├── matcher.ts         # 아티스트 매칭 5단계: 한글→영문→별칭→접미사제거→신규생성
│   │   ├── scheduler.ts       # node-cron (인터파크 0,30분 / YES24 10,40분 / 멜론 20,50분)
│   │   └── test.ts            # 크롤러 수동 테스트
│   └── scripts/
│       ├── seed-from-musicbrainz.ts  # MusicBrainz에서 한국 아티스트 시딩
│       └── enrich-artists.ts  # 기존 아티스트 MusicBrainz 데이터로 보강

apps/web/src/
├── app/                       # Next.js App Router 페이지
│   ├── page.tsx               # 홈 (히어로 + 최근공연 + 서비스소개)
│   ├── search/page.tsx        # 아티스트 검색 (300ms 디바운스)
│   ├── concerts/page.tsx      # 공연 목록 (장르 필터, 커서 페이지네이션)
│   ├── concerts/[id]/page.tsx # 공연 상세
│   ├── artist/[id]/page.tsx   # 아티스트 상세 + 구독
│   ├── my/page.tsx            # 마이페이지 (구독 아티스트)
│   ├── my/notifications/page.tsx  # 알림 목록
│   ├── settings/page.tsx      # 설정
│   ├── auth/kakao/callback/page.tsx  # OAuth 콜백
│   └── onboarding/page.tsx    # 온보딩
├── components/
│   ├── layout/                # Header, BottomNav, Container, AuthProvider
│   ├── home/                  # SearchBar, TrendingConcerts, UpcomingForYou
│   ├── concert/               # ConcertCard
│   ├── alerts/                # AlertCard, ChannelSettings
│   └── ui/                    # Badge, FilterPill, GradientButton, SurfaceCard, Toast, AvatarCircle
├── hooks/                     # useAuth, useSubscriptions, useNotificationCount, useToast
└── lib/
    ├── api.ts                 # API fetch 래퍼 (credentials: "include")
    ├── constants.ts
    ├── fcm.ts                 # 클라이언트 FCM
    └── format.ts

packages/shared/src/
├── index.ts                   # 모듈 재수출
├── types/                     # Artist, Concert, Notification 인터페이스
└── utils/
    ├── korean.ts              # normalizeKorean, normalizeForMatch, removeConcertSuffixes
    └── date.ts
```

---

## DB 스키마 핵심

- **Artist**: id, name, nameEn?, aliases[], imageUrl?, musicbrainzId?(unique)
- **Concert**: title, artistId?, venue?, startDate?, ticketOpenDate?, source(MELON|YES24|INTERPARK), sourceId, genre, status — `@@unique([source, sourceId])`
- **Subscription**: userId + artistId (unique pair)
- **Notification**: userId, concertId, type(NEW_CONCERT|TICKET_OPEN_SOON), sentAt, readAt?
- **CrawlLog**: source, startedAt, completedAt?, itemsFound, newItems, errors?, status

---

## 크롤러 파이프라인

1. **node-cron 스케줄**: 인터파크(0,30분) → YES24(10,40분) → 멜론(20,50분)
2. **수집**: 각 플랫폼 API/HTML에서 공연 데이터 파싱
3. **중복 제거**: `(source, sourceId)` 유니크 키로 기존 공연 스킵
4. **아티스트 매칭** (`matcher.ts` — 메모리 캐시 사용):
   - Step 1: 한글 이름 정확 매칭 (NFC 정규화, 긴 이름 우선)
   - Step 2: 영문 이름 매칭 (짧은 이름은 word boundary 적용)
   - Step 3: 별칭(aliases) 매칭
   - Step 4: 접미사 제거 후 재시도 (콘서트, 투어 등 34개 패턴)
   - Step 5: 매칭 실패 → 제목에서 아티스트명 추출 → 새 아티스트 자동 생성
5. **장르 분류**: 키워드 기반 (뮤지컬, 클래식, 힙합, 트로트, 페스티벌, 팬미팅)
6. **알림 발송**: 구독자 조회 → Notification 레코드 생성 → FCM 푸시

---

## MusicBrainz 연동

### API 클라이언트 (`src/lib/musicbrainz.ts`)
- Base URL: `https://musicbrainz.org/ws/2/`
- Rate limit: 1.1초 간격, User-Agent 헤더 필수
- 주요 함수:
  - `searchKoreanArtists(type?, limit, offset)` — `area:Korea` 쿼리
  - `searchArtistByName(name, limit)` — 이름 검색
  - `mapArtist(mbArtist)` — MusicBrainz → Artist 모델 매핑
  - `fetchAllKoreanArtists(type?, maxCount)` — AsyncGenerator 페이지네이션

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
pnpm --filter server seed:musicbrainz [--type group|person] [--limit N] [--dry-run]

# 기존 아티스트 enrichment (musicbrainzId가 없는 아티스트 대상)
pnpm --filter server enrich:artists [--dry-run]
```

시드 스크립트는 기존 DB 아티스트와 이름 매칭하여 중복 생성 방지. Enrichment는 매칭 점수 75점 이상만 업데이트.

---

## 인증 플로우

1. 클라이언트 → `/auth/kakao` → 카카오 OAuth
2. 카카오 콜백 → code로 access_token 교환
3. 카카오 프로필 조회 → User upsert → JWT 생성 → httpOnly 쿠키
4. 프론트엔드로 리다이렉트

---

## 프론트엔드 상태 관리

Zustand hooks 3개:
- `useAuth` — user, loading, fetchUser(), logout()
- `useSubscriptions` — subscriptions[], subscribedIds(Set), subscribe(), unsubscribe()
- `useNotificationCount` — count, fetch()

API 호출: `lib/api.ts` 래퍼 (credentials: "include" 고정)

---

## 주요 스크립트

```bash
pnpm dev                    # web(3000) + server(4000) 동시 실행
pnpm db:migrate             # Prisma 마이그레이션
pnpm db:seed                # 개발용 시드 (하드코딩 124 아티스트)
pnpm db:studio              # Prisma Studio
pnpm --filter server seed:musicbrainz  # MusicBrainz 시딩
pnpm --filter server enrich:artists    # 아티스트 enrichment
pnpm crawl:test             # 크롤러 수동 테스트
```

---

## 코드 컨벤션

- TypeScript strict, ES2022, ESM (`"type": "module"`)
- Tailwind CSS 인라인, 미니멀/에디토리얼 디자인 (뉴믹스커피/29cm 스타일)
- Gothic A1 폰트, font-weight 300, 작은 텍스트(11-15px), 넓은 자간(0.2-0.3em)
- 서버 컴포넌트 우선, "use client"는 상태/이벤트 필요 시만
- 커서 기반 페이지네이션 (offset 사용 안 함)
- Fastify route 등록 방식, 인증 필요 라우트: `preHandler: [fastify.authenticate]`
- 커밋 메시지: 한글
