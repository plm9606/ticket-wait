# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

```bash
# 개발 (tsx watch, hot reload)
pnpm dev

# 타입 체크 (lint = tsc --noEmit)
pnpm lint

# 테스트
pnpm test               # vitest run (단발)
pnpm test:watch         # vitest watch
# 단일 테스트 파일 실행
pnpm vitest run tests/application/artist.test.ts

# 빌드 & 실행
pnpm build              # tsc → dist/
pnpm start              # node dist/index.js

# 데이터 작업 (루트에서 실행)
pnpm crawl:test
pnpm seed:musicbrainz
pnpm enrich:artists
```

테스트 파일은 `tests/**/*.test.ts`에만 위치 (vitest.config.ts 기준).

## 아키텍처

헥사고날 아키텍처(Ports & Adapters). 의존성 방향: `infrastructure → application → ports → domain`

```
src/
├── domain/              # 순수 엔티티 타입 (Prisma 의존 없음)
│   ├── enums.ts         # TicketSource, PerformanceGenre 등 공유 열거형
│   └── *.entity.ts      # Artist, Performance, User 등
├── ports/
│   ├── in/              # Primary Port: Application이 외부에 노출하는 인터페이스
│   │   └── *.use-case.ts
│   └── out/             # Secondary Port: Application이 외부에 의존하는 인터페이스
│       └── *.port.ts
├── application/         # Use Case 구현 (ports/out 인터페이스만 의존)
│   ├── artist/
│   ├── performance/
│   ├── subscription/
│   ├── notification/
│   └── sync/            # KOPIS 동기화 + 아티스트 매칭
└── infrastructure/      # Port 구현체
    ├── persistence/     # Prisma Repository (Prisma → Domain 변환 포함)
    ├── external/        # 외부 API 어댑터 (kakao, fcm, kopis, musicbrainz)
    └── http/            # Fastify 라우트 (Driving Adapter)
```

### 앱 부트스트랩

`src/index.ts` → `src/app.ts` (`buildApp()`)

`buildApp()`에서 모든 의존성을 생성자 주입으로 조립:
1. Prisma 클라이언트 → Repository 구현체 생성
2. 외부 어댑터(FcmAdapter 등) 생성
3. Application Service에 Repository 주입
4. Fastify 라우트에 Application Service 주입

```typescript
// 의존성 조립 예시
const artistRepo = new PrismaArtistRepository(prisma);
const artistService = new ArtistService(artistRepo);
await fastify.register(artistRoutes, { artistService });
```

### 인증 패턴

JWT를 `token` 쿠키(httpOnly)에 저장. 두 가지 적용 방식:
- **모듈 전체 보호**: 라우트 파일 최상단에 `fastify.addHook("onRequest", fastify.authenticate)` — subscriptions, notifications 라우트에 사용
- **개별 라우트 보호**: `{ onRequest: [fastify.authenticate] }` 옵션 — `GET /performances/feed`, `GET /auth/me`에 사용

모바일 OAuth 콜백은 쿠키 대신 `concertalert://auth/callback?token=<jwt>` 딥링크로 토큰 전달.

### KOPIS 동기화 파이프라인

`KopisSyncService` (`application/sync/kopis-sync.service.ts`):
```
syncVenues() → KOPIS Facility API → IVenueRepository.upsert()
syncPerformances() → KOPIS Performance API → ArtistMatcher → upsertPerformances() → INotificationUseCase.notifyNewPerformances()
```

**아티스트 매칭** (`application/sync/artist-matcher.ts`):
우선순위: 한글 정확 매칭(NFC, 긴 이름 우선) → 영문 → alias → 접미사 제거 후 재시도 → 이름 추출 → **새 아티스트 자동 생성**

`ArtistMatcher`는 인스턴스 내 캐시(`cachedArtists`)를 유지. 새 아티스트 추가 시 `clearCache()`.

### 알림 중복 방지

`NotificationService.notifyNewPerformances()` 내부에서 `INotificationRepository.existsForPerformance()` 확인 후 발송.
FCM 미설정 시 graceful degradation (경고 로그만, 에러 없음).

### 커서 페이지네이션 패턴

Repository 계층에서 `buildCursorPage()` 헬퍼로 통일 처리:
```typescript
{ items: T[], nextCursor: number | null }
```
최대 50개 제한 (`Math.min(limit, 50)`)은 Application Service 계층에서 강제.

### 에러 응답

Application Service에서 `throw Object.assign(new Error("..."), { statusCode: 404 })` 패턴.
라우트에서 `err.statusCode`로 분기하여 HTTP 응답 코드 설정.

## 환경 변수

`src/config/env.ts`에서 검증. **필수**:
- `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI`
- `JWT_SECRET`
- `DATABASE_URL` 또는 (`DATABASE_USER` + `DATABASE_PASSWORD`)

`DATABASE_URL` 없으면 `DATABASE_HOST`(localhost), `DATABASE_PORT`(5432), `DATABASE_NAME`(concert_alert) 조합으로 빌드.
