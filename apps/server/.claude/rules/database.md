---
paths:
  - "prisma/**"
  - "src/**/*.ts"
---

# 데이터베이스 규칙

## PK 타입

- 모든 모델의 PK는 `Int @id @default(autoincrement())` 사용
- String cuid/uuid 금지
- FK도 `Int` 타입으로 통일

## FK Constraint

- 물리적 FK constraint 생성 안함 (`relationMode = "prisma"`)
