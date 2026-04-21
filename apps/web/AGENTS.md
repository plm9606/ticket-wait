# apps/web

Next.js 15 (App Router) 프론트엔드 (포트 3000).

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/app/layout.tsx` | 루트 레이아웃, 폰트(Manrope/Inter), 메타데이터 |
| `src/lib/api.ts` | API fetch 래퍼 (`credentials: "include"` 고정) |
| `src/hooks/` | `useAuth`, `useSubscriptions`, `useNotificationCount` |
| `src/styles/globals.css` | 디자인 토큰, Tailwind 커스텀 유틸리티 |
| `src/components/ui/` | 공통 UI — GradientButton, SurfaceCard, Badge, FilterPill, AvatarCircle |

## 명령어

```bash
pnpm dev            # Next.js dev server, 포트 3000
pnpm build          # 프로덕션 빌드
pnpm lint           # ESLint + tsc --noEmit
```

## 심층 문서

| 주제 | 문서 |
|------|------|
| 페이지 구조 & 상태 관리 | [docs/frontend.md](../../docs/frontend.md) |
| 디자인 시스템 (토큰, 컴포넌트 스펙) | [docs/design-system.md](../../docs/design-system.md) |
| UI 리뉴얼 계획 (7 Phase) | [docs/stitch-design-tech-spec.md](../../docs/stitch-design-tech-spec.md) |
| API 엔드포인트 | [docs/api.md](../../docs/api.md) |
