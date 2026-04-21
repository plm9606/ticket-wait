# AGENTS.md

**Backstage** (Concert Alert) — 구독한 아티스트의 새 공연이 KOPIS·멜론·YES24·인터파크에 등록되면 FCM 푸시 알림을 발송하는 서비스.

핵심 가치: "좋아하는 아티스트의 공연을 놓치지 않게 해준다"

---

## 모노레포 구조

| 패키지 | 경로 | 설명 |
|--------|------|------|
| Web | `apps/web/` | Next.js 15 프론트엔드 (포트 3000) → [AGENTS.md](apps/web/AGENTS.md) |
| Server | `apps/server/` | Fastify 5 API + KOPIS 동기화 (포트 4000) → [AGENTS.md](apps/server/AGENTS.md) |
| Mobile | `apps/mobile/` | Expo 55 앱 → [AGENTS.md](apps/mobile/AGENTS.md) |
| Shared | `packages/shared/` | 공유 타입 & 유틸 → [AGENTS.md](packages/shared/AGENTS.md) |

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 모노레포 | pnpm workspaces + Turborepo |
| 프론트엔드 | Next.js 15, React 19, Tailwind CSS 4, Zustand 5 |
| 백엔드 | Fastify 5, Prisma 6, PostgreSQL 16 |
| 인증 | 카카오 OAuth → JWT (httpOnly cookie, 30일) |
| 푸시 알림 | Firebase Cloud Messaging (FCM) |
| 공연 데이터 | KOPIS API (XML), Melon, YES24, Interpark |
| 아티스트 데이터 | MusicBrainz, Apple Music, Wikidata |

---

## 빠른 시작

```bash
docker compose up -d      # PostgreSQL 시작
pnpm install
pnpm db:migrate
pnpm dev                  # web(:3000) + server(:4000) 동시 실행
```

---

## 지식 베이스 (`docs/`)

심층 정보는 아래 문서를 참조:

| 문서 | 내용 |
|------|------|
| [docs/architecture.md](docs/architecture.md) | 헥사고날 아키텍처, 파일 맵, DI 조립 패턴 |
| [docs/api.md](docs/api.md) | API 엔드포인트 전체 목록, 인증 패턴 |
| [docs/database.md](docs/database.md) | DB 스키마 상세, 제약 조건 |
| [docs/auth.md](docs/auth.md) | 카카오 OAuth 플로우, JWT 설정 |
| [docs/crawler.md](docs/crawler.md) | KOPIS 동기화, 아티스트 매칭 알고리즘 |
| [docs/frontend.md](docs/frontend.md) | 상태 관리, 컴포넌트 구조, App Router |
| [docs/design-system.md](docs/design-system.md) | 디자인 토큰, 컴포넌트 스펙 (Nocturnal Editorial) |

---

## 코드 컨벤션

- TypeScript strict, ES2022, ESM (`"type": "module"`)
- 서버: 헥사고날 아키텍처 — `infrastructure → application → ports → domain`
- 웹: 서버 컴포넌트 우선, `"use client"`는 상태/이벤트 필요 시만
- 페이지네이션: 전체 커서 기반 (offset 없음)
- 커밋 메시지: 한글, `feat:` / `fix:` / `docs:` prefix 사용
