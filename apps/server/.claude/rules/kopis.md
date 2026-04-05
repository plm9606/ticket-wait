# KOPIS 외부 어댑터 규칙

## 파일 구조

KOPIS 관련 코드는 두 파일로 분리한다:

| 파일 | 역할 |
|------|------|
| `ports/out/kopis.port.ts` | OpenAPI 명세 기반 DTO 타입 + `IKopisPort` 인터페이스 |
| `infrastructure/external/kopis.adapter.ts` | XML 파싱, HTTP 요청, 정규화 헬퍼. `KopisAdapter` 클래스가 `IKopisPort`를 구현 |

**타입의 위치**: DTO 타입은 `ports/out/kopis.port.ts`에 정의한다. `kopis.adapter.ts`는 이 타입들을 re-export하여 단일 진입점 역할을 유지한다.

```typescript
// ports/out/kopis.port.ts
export interface IKopisPort { ... }
export interface PerformanceDetail { ... }

// infrastructure/external/kopis.adapter.ts
export type { PerformanceDetail, GenreCode, ... } from "../../ports/out/kopis.port.js";
export class KopisAdapter implements IKopisPort { ... }
```

## OpenAPI 명세 기반 타입 생성

- DTO 타입(`interface`, `type`)은 `openapi/KOPIS.yml`의 `components/schemas` 및 `components/parameters`를 기준으로 작성한다.
- 명세가 변경되면 `ports/out/kopis.port.ts`를 먼저 수정하고, adapter의 파싱 로직과 동기화한다.

## XML 파싱 규칙

KOPIS API는 XML을 반환한다. `KopisAdapter` 내부에 `fast-xml-parser`의 `XMLParser` 인스턴스를 생성하며 다음 옵션을 고정한다:

```ts
new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  isArray: (tagName) => ["db", "styurl", "relate", "mt13"].includes(tagName),
});
```

- `isArray`에 명시된 태그는 항상 배열로 파싱된다. 새 리스트 필드가 생기면 이 배열에 추가한다.
- 단일 항목도 배열로 올 수 있는 중첩 필드(예: `styurls.styurl`, `relates.relate`, `mt13s.mt13`)는 별도 private 정규화 메서드(`normalizeStyurls`, `normalizeRelates`, `normalizeMt13s`)로 처리한다.

## HTTP 요청 규칙

- 모든 요청은 내부 `fetchXml<T>()` private 메서드를 통해 보낸다.
- `service` 키는 `env.KOPIS_KEY`에서 읽으며, 비어 있으면 `"KOPIS_KEY is not configured"` 에러를 던진다.
- `undefined` 파라미터는 query string에서 자동 제외한다.
- `responseType: "text"`, `timeout: 15000` 고정.
