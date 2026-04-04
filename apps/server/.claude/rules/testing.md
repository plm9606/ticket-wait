---
paths:
  - "tests/**/*.test.ts"
---

# 테스트 규칙

## 폴더 구조

- 테스트 파일은 `src/` 내부가 아닌 `tests/` 폴더에 작성한다.
- `src/`의 디렉토리 구조를 그대로 미러링한다.
  - 예: `src/lib/kopis.ts` → `tests/lib/kopis.test.ts`

## 파일명

- `<대상파일명>.test.ts` 형식을 사용한다.

## import 경로

- `tests/` 내부에서 `src/`를 참조할 때는 상대 경로를 사용한다.
  - 예: `tests/lib/kopis.test.ts` → `../../src/lib/kopis.js`
- `vi.mock()` 경로도 동일한 기준으로 조정한다.
  - 예: `vi.mock("../../src/config/env.js", ...)`

## 실행

```bash
pnpm test         # 단일 실행
pnpm test:watch   # watch 모드
```
