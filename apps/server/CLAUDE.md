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
pnpm vitest run tests/lib/kopis.test.ts

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

### 앱 부트스트랩

`src/index.ts` → `src/app.ts` (`buildApp()`)

`buildApp()`은:
1. CORS, Cookie, JWT 플러그인 등록
2. `authPlugin` (`src/plugins/auth.ts`) 등록 — fastify 인스턴스에 `authenticate` 데코레이터 추가
3. 라우트 모듈 등록 순서: auth → artists → subscriptions → concerts → notifications

### 인증 패턴

JWT를 `token` 쿠키(httpOnly)에 저장. 두 가지 적용 방식:
- **모듈 전체 보호**: 라우트 파일 최상단에 `fastify.addHook("onRequest", fastify.authenticate)` — subscriptions, notifications 라우트에 사용
- **개별 라우트 보호**: `{ onRequest: [fastify.authenticate] }` 옵션 — `GET /concerts/feed`, `GET /auth/me`에 사용

모바일 OAuth 콜백은 쿠키 대신 `concertalert://auth/callback?token=<jwt>` 딥링크로 토큰 전달.

### 크롤러 파이프라인

`BaseCrawler` 추상 클래스를 상속:
```
fetchConcerts() → 중복 제거(source+sourceId) → matchArtist() → classifyGenre() → Concert 생성 → FCM 알림
```

`scheduler.ts`의 `runCrawlPipeline()`:
1. `crawler.run()` — 크롤 + 저장
2. `classifyUnclassifiedConcerts()` — 기존 CONCERT 장르 재분류
3. `matchUnmatchedConcerts()` — 미매칭 공연 재시도
4. 새로 매칭된 공연에 대해 `notifyNewConcerts()` 호출

### 아티스트 매칭 (`matcher.ts`)

우선순위 순서: 한글 정확 매칭(NFC, 긴 이름 우선) → 영문 → alias → 접미사 제거 후 재시도 → 정규식 추출 → **새 아티스트 자동 생성**

크롤 실행 중 아티스트 목록을 캐싱 (`cachedArtists`). 새 아티스트 추가 시 캐시 초기화.

### 알림 중복 방지

`notifyNewConcert()` 내부에서 `Notification.findFirst({ type: "NEW_CONCERT", concertId })` 확인 후 발송. FCM 미설정 시 graceful degradation (경고 로그만, 에러 없음).

### 커서 페이지네이션 패턴

모든 목록 API에서 동일하게:
```typescript
const take = Math.min(limit, 50);
const results = await prisma.concert.findMany({
  take: take + 1,
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
});
const hasMore = results.length > take;
```

### 에러 응답

- 인증 실패: `reply.status(401).send({ error: "Unauthorized" })`
- 리소스 없음: `reply.status(404).send({ error: "... not found" })`
- 중복: `reply.status(409).send({ error: "Already subscribed" })`
- 일부 라우트는 `throw { statusCode, message }` 형태 사용 (Fastify가 자동 처리)

## 환경 변수

`src/config/env.ts`에서 검증. **필수**:
- `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI`
- `JWT_SECRET`
- `DATABASE_URL` 또는 (`DATABASE_USER` + `DATABASE_PASSWORD`)

`DATABASE_URL` 없으면 `DATABASE_HOST`(localhost), `DATABASE_PORT`(5432), `DATABASE_NAME`(concert_alert) 조합으로 빌드.
