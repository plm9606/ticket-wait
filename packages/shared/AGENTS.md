# packages/shared

웹·서버·모바일이 공유하는 TypeScript 타입 및 유틸리티.

## 내보내는 타입 (`src/types/`)

| 타입 | 설명 |
|------|------|
| `Artist` | 아티스트 (id, name, nameEn, aliases, imageUrl) |
| `Performance` | 공연 (id, title, venue, dates, source, genre, status) |
| `Notification` | 알림 (id, type, sentAt, readAt, performance) |

## 내보내는 유틸 (`src/utils/`)

| 파일 | 함수 | 설명 |
|------|------|------|
| `korean.ts` | `normalizeKorean()` | NFC 정규화 |
| `korean.ts` | `normalizeForMatch()` | 매칭용 정규화 (소문자, 공백 제거) |
| `korean.ts` | `removeConcertSuffixes()` | "콘서트", "투어" 등 접미사 제거 |
| `date.ts` | 날짜 포맷 헬퍼 | |

## 사용법

```typescript
import type { Artist, Performance } from "@concert-alert/shared";
import { normalizeKorean } from "@concert-alert/shared/utils/korean";
```
