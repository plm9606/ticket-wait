---
paths:
  - "src/**/*.ts"
---

# 헥사고날 아키텍처 규칙

## 계층 구조 및 의존성 방향

의존성은 항상 안쪽(domain)으로만 흐른다:

```
infrastructure → application → ports → domain
```

## 계층별 금지 사항

- **domain/**: Prisma import 금지. 순수 TypeScript 타입만.
- **ports/**: 구현 코드 금지. `interface` / `type` 선언만.
- **application/**: Prisma import 금지. `ports/out/` 인터페이스를 통해서만 외부(DB·API)에 접근.
- **infrastructure/http/**: Application Service를 직접 `new` 하지 않는다. `app.ts`에서 주입받는다.

## 네이밍 컨벤션

| 계층 | 파일 위치 | 파일명 패턴 | 인터페이스/클래스명 |
|------|-----------|-------------|---------------------|
| Primary(In) Port | `ports/in/` | `**.use-case.ts` | `I**UseCase` |
| Secondary(Out) Port | `ports/out/` | `**.port.ts` | `I**Repository` / `I**Service` |
| Domain Entity | `domain/` | `**.entity.ts` | interface |
| Application Service | `application/**/` | `**.service.ts` | `**Service implements I**UseCase` |
| Prisma Repository | `infrastructure/persistence/` | `**.repository.ts` | `Prisma**Repository` |
| External Adapter | `infrastructure/external/` | `**.adapter.ts` | `**Adapter` |
| HTTP Route | `infrastructure/http/**/` | `*.route.ts` | 함수 export |

## Port 인터페이스 구현 위치

- Out port(`ports/out/`) 구현체는 반드시 `infrastructure/` 하위에만 위치
- In port(`ports/in/`) 구현체는 `application/` 하위 service 파일

## 의존성 주입

- 모든 의존성은 `app.ts`에서 생성자 주입으로 조립
- Application Service는 port 인터페이스 타입으로 의존성 선언:
  ```typescript
  constructor(private artists: IArtistRepository) {}
  ```
- Infrastructure 어댑터를 Application 계층에서 직접 import 금지
  - 예외: `application/sync/` 는 `infrastructure/external/kopis.adapter.ts`를 직접 사용 가능 (sync 파이프라인 전용 외부 어댑터)

## Prisma → Domain 변환

- Repository 구현체 내부에 `toEntityName()` 변환 함수를 정의
- Prisma 타입이 `application/` 계층으로 유출되어선 안 됨
