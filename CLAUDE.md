# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 명령어

```bash
# DB 시작 (최초 1회)
docker compose up -d
pnpm install
pnpm db:migrate

# 개발 서버 (web :3000 + server :4000 동시 실행)
pnpm dev

# 테스트 (server만 존재)
pnpm --filter server test
pnpm --filter server test:watch

# DB 작업
pnpm db:seed          # 시드 데이터
pnpm db:studio        # Prisma Studio

# 크롤러 관련
pnpm crawl:test              # 크롤러 1회 테스트 실행
pnpm seed:musicbrainz        # MusicBrainz에서 아티스트 임포트
pnpm enrich:artists          # 아티스트 이미지/별칭 수집

# 빌드 & 린트
pnpm build
pnpm lint                    # TypeScript 타입 체크 포함
```

## 아키텍처 개요

pnpm workspaces + Turborepo 모노레포. `apps/web` (Next.js 15), `apps/server` (Fastify 5), `apps/mobile` (Expo 55), `packages/shared` (공유 타입/유틸) 4개 패키지로 구성.

### 서버 (`apps/server`)

- **진입점**: `src/index.ts` → `src/app.ts` (Fastify 앱 빌더, 플러그인/라우트 등록)
- **인증**: `src/plugins/auth.ts` — JWT를 httpOnly 쿠키에서 검증. 보호 라우트는 `preHandler: [fastify.authenticate]`
- **라우트**: `src/routes/{auth,artists,concerts,subscriptions,notifications}/`
- **크롤러**: `src/crawlers/` — `base.crawler.ts` 추상 클래스 상속. 매시 스태거드 실행 (인터파크 0/30분, YES24 10/40분, 멜론 20/50분)
- **아티스트 매칭**: `src/crawlers/matcher.ts` — 한글 NFC 정규화 → 영문 → alias → 접미사 제거 → 정규식 순서로 시도. 매칭 실패 시 신규 아티스트 생성
- **환경변수**: `src/config/env.ts`에서 검증. `DATABASE_URL` 또는 `DATABASE_*` 개별 항목 필요

### 웹 (`apps/web`)

- **App Router** 기반. 서버 컴포넌트 우선, `"use client"`는 상태/이벤트 필요 시만
- **상태 관리**: Zustand 3개 스토어 — `useAuth`, `useSubscriptions`, `useNotificationCount`
- **API 호출**: 모두 `src/lib/api.ts` 래퍼 경유 (`credentials: "include"` 고정)
- **페이지네이션**: 전체 커서 기반 (offset 없음)

### 공유 패키지 (`packages/shared`)

타입 정의(`Artist`, `Concert`, `Notification`)와 한글 정규화 유틸(`src/utils/korean.ts`) 제공.

## 코드 컨벤션

- **디자인**: 미니멀 에디토리얼 톤. 텍스트 크기 `text-[11px]`~`text-[15px]`, 자간 `tracking-[0.2em]`~`[0.3em]`
- **폰트**: Gothic A1 (웹), Pretendard (모바일), font-weight 300 기본
- **커밋 메시지**: 한글, `feat:` / `fix:` / `docs:` 등 prefix 사용
