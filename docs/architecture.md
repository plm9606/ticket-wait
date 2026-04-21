# 아키텍처

## 패턴: 헥사고날 아키텍처 (Ports & Adapters)

의존성 방향: `infrastructure → application → ports → domain`

```
domain/          — 순수 엔티티 타입. 외부 의존 없음
ports/in/        — Primary Port: Application이 외부에 노출하는 인터페이스 (use-case)
ports/out/       — Secondary Port: Application이 의존하는 외부 인터페이스 (repository, adapter)
application/     — Use Case 구현 (ports/out 인터페이스만 의존)
infrastructure/  — Port 구현체 (Prisma, Fastify 라우트, 외부 API)
```

---

## 파일 맵 (`apps/server/src/`)

```
src/
├── index.ts                          # 서버 엔트리포인트
├── app.ts                            # buildApp() — 의존성 조립 + Fastify 등록
├── config/env.ts                     # 환경변수 zod 검증
├── plugins/auth.ts                   # fastify.authenticate 데코레이터
├── openapi/KOPIS.yml                 # KOPIS API OpenAPI 명세
├── domain/
│   ├── enums.ts                      # TicketSource, PerformanceGenre, PerformanceStatus 등
│   ├── artist.entity.ts
│   ├── performance.entity.ts
│   ├── venue.entity.ts
│   ├── user.entity.ts
│   ├── subscription.entity.ts
│   └── notification.entity.ts
├── ports/
│   ├── in/                           # Primary Ports (Use Case 인터페이스)
│   │   ├── artist.use-case.ts
│   │   ├── create-artist.use-case.ts
│   │   ├── enrich-artist.use-case.ts
│   │   ├── notification.use-case.ts
│   │   ├── performance.use-case.ts
│   │   └── subscription.use-case.ts
│   └── out/                          # Secondary Ports
│       ├── artist.port.ts
│       ├── performance.port.ts
│       ├── venue.port.ts
│       ├── user.port.ts
│       ├── subscription.port.ts
│       ├── notification.port.ts
│       ├── kopis.port.ts             # OpenAPI 명세 기반 DTO + IKopisPort
│       ├── kakao-auth.port.ts
│       ├── push-notification.port.ts
│       ├── musicbrainz.port.ts
│       ├── apple-music.port.ts
│       ├── wikidata.port.ts
│       ├── image-enrichment.port.ts
│       ├── sync-log.port.ts
│       └── sync-dlq.port.ts
├── application/
│   ├── artist/
│   │   ├── artist.service.ts
│   │   ├── create-artist.service.ts  # MusicBrainz → Apple Music → Wikidata 이미지 조회
│   │   └── enrich-artist.service.ts
│   ├── notification/
│   │   └── notification.service.ts
│   ├── performance/
│   │   └── performance.service.ts
│   ├── subscription/
│   │   └── subscription.service.ts
│   └── sync/
│       ├── kopis-sync.service.ts     # KOPIS 공연/시설 동기화 오케스트레이터
│       ├── artist-matcher.ts         # 공연명 → 아티스트 매칭 (5단계)
│       ├── genre-classifier.ts       # KOPIS 장르 코드 → PerformanceGenre 분류
│       ├── name-extractor.ts         # 공연명에서 아티스트명 추출
│       └── performance-upsert.ts     # Performance 업서트 로직
├── infrastructure/
│   ├── persistence/                  # Prisma Repository 구현체
│   │   ├── prisma.ts
│   │   ├── artist.repository.ts
│   │   ├── performance.repository.ts
│   │   ├── venue.repository.ts
│   │   ├── user.repository.ts
│   │   ├── subscription.repository.ts
│   │   ├── notification.repository.ts
│   │   ├── sync-log.repository.ts
│   │   └── sync-dlq.repository.ts
│   ├── external/                     # 외부 API 어댑터
│   │   ├── kopis.adapter.ts
│   │   ├── kakao.adapter.ts
│   │   ├── fcm.adapter.ts
│   │   ├── apple-music.adapter.ts
│   │   ├── musicbrainz.adapter.ts
│   │   ├── wikidata.adapter.ts
│   │   └── image-enrichment.adapter.ts
│   └── http/                         # Fastify 라우트 (Driving Adapter)
│       ├── auth/kakao.route.ts
│       ├── artists/artist.route.ts
│       ├── performances/performance.route.ts
│       ├── subscriptions/subscription.route.ts
│       └── notifications/notification.route.ts
├── crawlers/
│   └── scheduler.ts                  # node-cron 스케줄러 (KOPIS 동기화 트리거)
└── scripts/
    ├── seed-from-musicbrainz.ts      # MusicBrainz에서 아티스트 시딩
    └── sync-performances.ts          # KOPIS 공연 1회 동기화
```

---

## 외부 어댑터 → 포트 매핑

| 어댑터 | 구현 포트 |
|--------|-----------|
| `KopisAdapter` | `IKopisPort` |
| `KakaoAdapter` | `IKakaoAuthPort` |
| `FcmAdapter` | `IPushNotificationService` |
| `ImageEnrichmentAdapter` | `IImageEnrichmentPort` |
| `AppleMusicAdapter` | `IAppleMusicPort` |
| `WikidataAdapter` | `IWikidataPort` |
| `MusicBrainzAdapter` | `IMusicBrainzPort` |

---

## 앱 부트스트랩 (`app.ts`)

`buildApp()`에서 모든 의존성을 생성자 주입으로 조립. leaf 의존성부터 순차 생성:

```typescript
// 1. 외부 어댑터 (leaf 먼저)
const musicbrainz    = new MusicBrainzAdapter();
const appleMusic     = new AppleMusicAdapter();
const wikidata       = new WikidataAdapter(musicbrainz);
const imageEnrichment = new ImageEnrichmentAdapter(appleMusic, wikidata);
const kopis          = new KopisAdapter();
const kakaoAuth      = new KakaoAdapter();

// 2. Prisma Repository 구현체
const artistRepo = new PrismaArtistRepository(prisma);
// ...

// 3. Application Service (Repository + Adapter 주입, 포트 인터페이스 타입으로)
const artistService = new ArtistService(artistRepo);
// ...

// 4. Fastify 라우트에 Service 주입
```

---

## 핵심 패턴

### 에러 응답

```typescript
// Application Service에서 throw
throw Object.assign(new Error("Not found"), { statusCode: 404 });
// 라우트에서 err.statusCode로 분기하여 HTTP 응답 설정
```

### 커서 페이지네이션

```typescript
// Repository: buildCursorPage() 헬퍼로 통일
{ items: T[], nextCursor: number | null }
// Application Service: Math.min(limit, 50) 강제 (최대 50개)
```

### 알림 중복 방지

`NotificationService.notifyNewPerformances()` 내부에서  
`INotificationRepository.existsForPerformance()` 확인 후 발송.  
FCM 미설정 시 graceful degradation (경고 로그만, 에러 없음).
