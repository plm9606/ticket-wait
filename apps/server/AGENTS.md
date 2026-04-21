# apps/server

Fastify 5 + TypeScript API 서버 (포트 4000). 헥사고날 아키텍처(Ports & Adapters) 적용.

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/index.ts` | 엔트리포인트 |
| `src/app.ts` | `buildApp()` — 의존성 조립 + Fastify 등록 |
| `src/config/env.ts` | 환경변수 zod 검증 |
| `src/plugins/auth.ts` | `fastify.authenticate` 데코레이터 |
| `src/openapi/KOPIS.yml` | KOPIS API OpenAPI 명세 |
| `prisma/schema.prisma` | DB 스키마 |

## 명령어

```bash
pnpm dev            # tsx watch (hot reload), 포트 4000
pnpm lint           # tsc --noEmit
pnpm test           # vitest run (단발)
pnpm test:watch     # vitest watch
pnpm build          # tsc → dist/
pnpm start          # node dist/index.js
```

테스트 파일은 `tests/**/*.test.ts`에만 위치 (vitest.config.ts 기준).

## 심층 문서

| 주제 | 문서 |
|------|------|
| 아키텍처 & 파일 맵 | [docs/architecture.md](../../docs/architecture.md) |
| API 엔드포인트 | [docs/api.md](../../docs/api.md) |
| DB 스키마 | [docs/database.md](../../docs/database.md) |
| 인증 플로우 & 환경변수 | [docs/auth.md](../../docs/auth.md) |
| KOPIS 동기화 & 아티스트 매칭 | [docs/crawler.md](../../docs/crawler.md) |
| 공연 데이터 수급 (KOPIS) | [docs/data-sourcing-performances.md](../../docs/data-sourcing-performances.md) |
| 아티스트 데이터 수급 (MusicBrainz/Apple Music/Wikidata) | [docs/data-sourcing-artists.md](../../docs/data-sourcing-artists.md) |

## 로컬 규칙

`.claude/rules/kopis.md` — KOPIS 어댑터 코딩 규칙 (XML 파싱, DTO 타입 위치).
