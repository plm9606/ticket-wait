# KOPIS 동기화 & 아티스트 매칭

## KOPIS 동기화 파이프라인

`KopisSyncService` (`application/sync/kopis-sync.service.ts`):

```
syncVenues()
  → IKopisPort.listFacilities / getFacility
  → IVenueRepository.upsert()

syncPerformances()
  → IKopisPort.listPerformances / getPerformance
  → ArtistMatcher.resolve()     (캐스트명 → 아티스트 ID)
  → upsertPerformances()
  → INotificationUseCase.notifyNewPerformances()
```

스케줄러: `crawlers/scheduler.ts` (node-cron) — 매시 정각 트리거.

---

## 아티스트 매칭 알고리즘

`application/sync/artist-matcher.ts` — 5단계 우선순위 시도:

1. **한글 정확 매칭** — NFC 정규화, 긴 이름 우선 (부분 문자열 포함 관계 처리)
2. **영문 이름 매칭** — 짧은 이름(≤3자)은 word boundary 적용
3. **별칭(alias) 매칭** — `Artist.aliases[]` 배열 탐색
4. **접미사 제거 후 재시도** — "콘서트", "투어", "페스티벌" 등 제거 후 1~3 재시도
5. **이름 추출** (`name-extractor.ts`) — 공연명에서 아티스트명 패턴 파싱

매칭 실패 → `ICreateArtistUseCase.execute()`로 신규 아티스트 자동 생성.

`ArtistMatcher` 인스턴스 내 캐시(`cachedArtists`) 유지.  
신규 아티스트 추가 시 `clearCache()` 호출하여 캐시 무효화.

---

## 신규 아티스트 자동 생성

`application/artist/create-artist.service.ts`:

1. MusicBrainz 키워드 검색 (`searchByKeyword`)
2. 한국어 alias 우선으로 name/nameEn 결정 (→ [MusicBrainz 이름 매핑](#musicbrainz-이름-매핑) 참조)
3. Apple Music에서 아티스트 이미지 스크래핑
4. Apple Music 실패 시 Wikidata fallback (MBID → Wikidata ID → 이미지)
5. `IArtistRepository.create()` 저장

---

## 장르 분류

`application/sync/genre-classifier.ts` — KOPIS 장르 코드 우선, 없으면 키워드 기반:

| 키워드 | 분류 |
|--------|------|
| "뮤지컬" | `MUSICAL` |
| "클래식", "오페라", "오케스트라" | `CLASSIC` |
| "페스티벌", "festival" | `FESTIVAL` |
| "팬미팅", "fan meeting" | `FAN_MEETING` |
| 나머지 | `CONCERT` |

---

## MusicBrainz 이름 매핑

| Artist 필드 | MusicBrainz 소스 |
|---|---|
| `name` (한글) | aliases 중 `locale:"ko"` & `primary:true` → ko alias → 최상위 name |
| `nameEn` (영문) | aliases 중 `locale:"en"` & `primary:true` → 최상위 name |
| `aliases` | 나머지 모든 alias (중복 제거) |
| `musicbrainzId` | MusicBrainz MBID (UUID) |

### MusicBrainz 어댑터 (`infrastructure/external/musicbrainz.adapter.ts`)

- `searchByKeyword(name, limit?)` — 이름으로 아티스트 검색
- `fetchAllKoreanArtists(type?, maxCount?)` — `area:Korea` 쿼리, AsyncGenerator
- `getArtistWikidataId(mbid)` — MBID → Wikidata ID

---

## CLI 스크립트

```bash
# KOPIS 공연 1회 동기화
pnpm sync:performances

# 크롤러 1회 테스트 실행
pnpm crawl:test

# MusicBrainz에서 한국 아티스트 시딩
pnpm seed:musicbrainz [--type group|person] [--limit N] [--dry-run]

# 아티스트 이미지/별칭 보강 (Apple Music + Wikidata)
pnpm enrich:artists
```

---

## KOPIS 어댑터 규칙 (`.claude/rules/kopis.md`)

- DTO 타입은 `ports/out/kopis.port.ts`에 정의, `kopis.adapter.ts`에서 re-export
- XML 파싱: `fast-xml-parser`, `isArray`에 `["db", "styurl", "relate", "mt13"]` 고정
- 모든 요청은 내부 `fetchXml<T>()` private 메서드 경유
- `service` 키는 `env.KOPIS_KEY`에서 읽음
