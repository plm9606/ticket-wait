# 아티스트 데이터 수급

아티스트는 3가지 경로로 들어온다: ① Prisma `seed.ts`의 고정 시드,
② MusicBrainz 일괄 시딩 스크립트, ③ KOPIS 동기화 중 `prfcast`에서 신규 생성.
이미지/별칭은 Apple Music + Wikidata로 보강된다.

## 소스 & 엔드포인트

| 소스 | 어댑터 | 포트 | 용도 |
|------|--------|------|------|
| MusicBrainz (`musicbrainz.org/ws/2`) | `MusicBrainzAdapter` | `IMusicBrainzPort` | 한국 아티스트 검색, MBID → Wikidata ID 역조회 |
| iTunes Search API (`itunes.apple.com/search`) | `AppleMusicAdapter` | `IAppleMusicPort` | `appleMusicId` 및 아티스트 페이지 URL 획득 |
| Apple Music 웹 (`music.apple.com/...`) | `AppleMusicAdapter.scrapeImageUrl` | — | HTML에서 아티스트 이미지 스크래핑 (Cheerio) |
| Wikidata (`www.wikidata.org/w/api.php`) | `WikidataAdapter` | `IWikidataPort` | P18(이미지) claim → Wikimedia Commons URL |
| Prisma seed 파일 (`prisma/seed.ts`) | — | — | 대표 아티스트 ~100명 고정 시드 |
| KOPIS `prfcast` | `KopisSyncService.matchArtistsForPerformance` | — | 동기화 시 이름만으로 신규 생성 |

모든 외부 어댑터는 `UA`를 지정해 403을 피하도록 구성됨.

### MusicBrainz

- `searchByKeyword(name, limit?)` → `GET /artist?query=<name>` 검색 결과 상위 N개.
- `fetchAllKoreanArtists(type?, max?)` → `query=area:Korea[ AND type:(group|person)]`
  AsyncGenerator. **1.1초 간격 레이트리밋**(MusicBrainz 정책 `1req/sec` 준수).
- `getArtistWikidataId(mbid)` → `/artist/{mbid}?inc=url-rels`, `type=wikidata` 관계에서
  `Q\d+` ID 추출.

### 이름 매핑 (`mapMBArtist` / `mapArtist`)

| DB 필드 | MusicBrainz 소스 |
|---------|-----------------|
| `name` (한글) | `aliases[locale="ko", primary=true]` → `locale="ko"` 첫 번째 → 실패 시 `mb.name` |
| `nameEn` (영문) | `aliases[locale="en", primary=true]` → `locale="en"` 첫 번째 → `mb.name`. 단 `name`과 같으면 `null` |
| `aliases` | 위에서 쓰지 않은 나머지 alias 전체 (중복 제거) |
| `musicbrainzId` | `mb.id` (UUID) |

동일한 로직이 `musicbrainz.adapter.ts`의 `mapArtist`와 `create-artist.service.ts`의
`mapMBArtist`에 중복 구현되어 있다. (→ "아직 부족한 부분" 참조)

### Apple Music (iTunes Search)

- `searchArtist(name, nameEn, aliases)` → `GET /search?term=<nameEn ?? name>&entity=musicArtist&country=KR&limit=5`
- 결과 매칭 우선순위:
  1. 쿼리와 정확 일치 (`normalizeForMatch`)
  2. `nameEn`이 있으면 `name`(한글)과 정확 일치
  3. `aliases` 중 일치
- 매칭되면 `{ appleMusicId, artistPageUrl }` 반환.

### Apple Music 이미지 스크래핑

`scrapeImageUrl(artistPageUrl)`에서 Cheerio로 두 레이아웃을 처리:

1. **원형 아바타** (`.artist-header__circular-artwork-container`)
   → `<source type="image/jpeg">`의 `srcset` 가장 큰 URL → `/600x600cc.jpg`로 교체
2. **풀블리드 비디오 헤더** (`.artist-header[style*="--background-image"]`)
   → `ami-identity` URL 추출 → `/600x600bb.jpg`로 교체

### Wikidata Fallback

`WikidataAdapter.getImageUrlByMbid(mbid)`:

1. `musicbrainz.getArtistWikidataId(mbid)`로 Q ID 조회
2. `wbgetentities?ids=Q...&props=claims`에서 P18 파일명 추출
3. `https://commons.wikimedia.org/wiki/Special:FilePath/<filename>` 조립

## 데이터 구조

```prisma
model Artist {
  id            Int      @id @default(autoincrement())
  name          String                       // 한글 우선
  nameEn        String?                      // 영문 (name과 다를 때만)
  aliases       String[] @default([])        // 별칭 배열 (Postgres text[])
  imageUrl      String?                      // Apple Music 또는 Wikimedia URL
  musicbrainzId String?  @unique             // MBID (UUID)
  appleMusicId  Int?     @unique             // iTunes artistId
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  performanceArtists PerformanceArtist[]
  subscriptions      Subscription[]
}
```

도메인 타입은 `domain/artist.entity.ts` 참조. 매칭용 경량 타입
`ArtistMatchData = { id, name, nameEn, aliases }`를 캐시로 사용.

## 수급 경로 (3가지)

### ① 고정 시드 (`prisma/seed.ts`)

- K-pop 그룹/솔로/밴드/힙합/트롯/해외 아티스트 약 100명을 하드코딩.
- `pnpm db:seed` 또는 `pnpm --filter server prisma db seed` 1회 실행.
- `name` 기준 idempotent upsert. `nameEn`, `aliases`만 업데이트.
- MusicBrainz/Apple Music 연계 없음 → `imageUrl`, `musicbrainzId`, `appleMusicId`는
  이후 enrichment에서 채워짐.

### ② MusicBrainz 일괄 시딩 (`seed-from-musicbrainz.ts`)

```bash
pnpm seed:musicbrainz                     # 한국 아티스트 전체
pnpm seed:musicbrainz --type group        # 그룹만
pnpm seed:musicbrainz --type person --limit 200
pnpm seed:musicbrainz --dry-run           # DB 기록 없이 매핑 결과만 출력
```

흐름:

1. 기존 Artist 테이블 전체를 메모리 로드 → `normalizeForMatch` 기반 인덱스
   구축 (`Map<normalized, id>`).
2. `fetchAllKoreanArtists(type, limit)` AsyncGenerator로 100건 배치 수신.
3. 각 MBArtist마다:
   - `type`(group/person)이 `null`이면 스킵.
   - 이미 같은 `musicbrainzId`가 있으면 스킵.
   - `mapArtist()`로 정규화.
   - `ImageEnrichmentAdapter.fetchImageData()`로 이미지/appleMusicId 수집.
   - 이름 인덱스로 기존 아티스트 조회:
     - 있으면 `update` (musicbrainzId, nameEn, appleMusicId, imageUrl, aliases 병합)
     - 없으면 `create`
4. 통계 로그 출력(`생성 / 업데이트 / 스킵 / 에러`).

### ③ KOPIS 동기화 중 자동 생성 (`CreateArtistService`)

`KopisSyncService`가 `prfcast` 파싱 후 각 이름마다 호출하는 경로.

```
prfcast 이름
  → IArtistRepository.findByName (정확 매칭)
  → 실패 시 CreateArtistService.execute(name):
      1. MusicBrainz.searchByKeyword(name, 10) → 상위 1건
         (점수 검증 없이 무조건 top1 채택)
      2. 매핑된 name/nameEn/aliases/musicbrainzId 또는 원본 name fallback
      3. ImageEnrichmentAdapter.fetchImageData():
           a. Apple Music 검색 → 페이지 URL → 이미지 스크랩
           b. 실패 시 Wikidata(MBID → Q ID → Commons URL)
      4. IArtistRepository.create()
```

동기화 파이프라인에서 `ArtistMatcher.matchOrCreate`가 아닌
`matchArtistsForPerformance`가 직접 `findByName` + `createArtist`를 호출한다.
`ArtistMatcher`(5단계 퍼지 매칭)는 현재 `KopisSyncService`에서 사용되지 않으며,
별도 경로(미매칭 공연 백필)에서만 활용된다. (→ "아직 부족한 부분" 참조)

## 이미지 보강 전용 서비스 (`EnrichArtistService`)

`imageUrl IS NULL`인 아티스트만 대상으로 한 별도 유스케이스.

- `enrichOne(artistId)`: 새 아티스트 1건 처리 (CreateArtistService 내부에서
  사용될 수도 있는 hook — 현재는 `ArtistMatcher` 경로에서만 호출).
- `enrichAll()`: `findAllWithoutImage()`로 전수 조회 후 순차 처리.

⚠️ `package.json`에 `enrich:artists` 스크립트 **존재하지 않음**.
루트 `CLAUDE.md` / `docs/crawler.md`에는 `pnpm enrich:artists`가 문서화되어
있으나 실제 CLI 바인딩이 없다. 현재는 코드에서 호출하는 경로만 있음.

## 배치 주기 요약

| 작업 | 트리거 | 빈도 |
|------|--------|------|
| 고정 시드 | `pnpm db:seed` (수동) | 초기 세팅 시 1회 |
| MusicBrainz 일괄 시딩 | `pnpm seed:musicbrainz` (수동) | 대량 추가가 필요할 때 수동 |
| KOPIS 중 자동 생성 | `KopisSyncService.syncPerformances` | 매일 새벽 3시 KST |
| 이미지 보강 (enrichAll) | 스크립트 부재 (코드만 존재) | **현재 자동 실행 경로 없음** |

## 마이그레이션 전략

### 현재까지의 스키마 진화 (`prisma/migrations/` 순서)

1. `20260308125151_init` — 초기 스키마
2. `20260308142806_add_concert_genre` — 장르 enum 추가
3. `20260328013959_add_musicbrainz_id` — `Artist.musicbrainzId`
4. `20260404161444_rename_concert_to_performance` — `Concert` → `Performance`
5. `20260404164948_int_pk_migration` — cuid/uuid → `Int autoincrement` 전환
6. `20260405000000_add_artist_spotify_id` — (처음엔 Spotify로 시작)
7. `20260405000001_rename_spotifyid_to_applemusicid` — Spotify → Apple Music
8. `20260405050039_add_sync_dlq` — Dead Letter Queue
9. `20260405052309_add_performance_artist_table` — N:M 관계 테이블
10. `20260405072326_add_sync_log_checkpoint` — 재개를 위한 체크포인트 컬럼

### 운영 마이그레이션 정책

- `relationMode = "prisma"` — **물리적 FK 제약 없음**. Prisma만 관계를 인지.
- 모든 PK는 `Int @id @default(autoincrement())` (`.claude/rules/database.md` 규칙).
- 마이그레이션 실행:
  ```bash
  pnpm db:migrate               # prisma migrate dev
  pnpm --filter server prisma migrate deploy    # 프로덕션
  ```
- 이력 가능한 운영 DB에 아직 사용자 데이터가 쌓이지 않은 상태라 과거
  마이그레이션이 공격적으로 드롭/리네임을 수행한다 (예: `rename_concert_to_performance`,
  `int_pk_migration`). 향후 프로덕션 런칭 이후로는 무중단 마이그레이션 절차
  필요.

### 데이터 재정렬 전략

- **MusicBrainz 역연결 (백필)**: `seed-from-musicbrainz.ts`는 이름 인덱스를
  사용해 기존 레코드에 `musicbrainzId` / `nameEn` / `aliases`를 사후 연결한다.
- **이미지 백필**: `EnrichArtistService.enrichAll()`. 스크립트 바인딩은 미완.
- **아티스트 병합/중복 해소 도구 없음**: `musicbrainzId` / `appleMusicId` 유니크
  제약은 있지만, `prfcast`에서 만들어진 동명이인/표기 차이를 수동 병합하는
  절차가 아직 없다.

## 아직 부족한 부분

### 매칭 정확도
- **KOPIS 동기화 경로는 `findByName` 정확 일치만 사용.** 5단계 퍼지 매칭
  (`ArtistMatcher`) 결과가 KOPIS 경로에 반영되지 않는다. 한글/영문 혼용, 조사,
  접미사 차이로 인해 **같은 아티스트가 여러 레코드로 파편화**될 가능성이 크다.
  `ArtistMatcher.matchOrCreate`를 경로에 삽입하거나 `findByName`을 정규화 기반
  매칭으로 개선해야 한다.
- **MusicBrainz 검색 결과를 `score` 검증 없이 top1 채택.** 오매칭 시 엉뚱한
  MBID/이미지가 저장될 수 있음. 임계값(예: `score >= 90`) + 이름 유사도
  이중 확인 필요.
- **신규 아티스트의 이미지/MBID가 비어있어도 재시도 없음.** 최초 생성 시
  enrichment가 실패하면 이후 수동 개입 없이는 채워지지 않는다.

### 코드 중복 / 구조
- `mapMBArtist` 로직이 `musicbrainz.adapter.ts::mapArtist`와
  `create-artist.service.ts::CreateArtistService.mapMBArtist`에 중복. 한쪽으로
  통일 필요.
- `ArtistMatcher`가 `KopisSyncService`에서 사용되지 않음에도 주입 경로가
  남아있어 dead code 소지.

### 운영 / 자동화
- **`enrich:artists` 스크립트 부재**: 문서에 노출되나 실제 바인딩 없음.
  `package.json`에 추가하거나 문서에서 제거.
- **`crawl:test` 레거시 참조**: 대상 파일이 없다.
- **이미지 보강 스케줄 없음**: enrichAll이 cron에 걸려 있지 않음. imageUrl이
  비어 있는 아티스트가 점점 쌓인다.
- **레이트리밋 간섭**: MusicBrainz는 1req/sec인데 KOPIS 동기화 중
  공연마다 `searchByKeyword`를 호출하므로, 캐스트 수가 많은 날 하루 처리
  시간에 상당히 영향을 준다. 캐시/배치화 필요.
- **이미지 URL만 저장, 캐싱/CDN 없음**: Apple Music / Wikimedia 이미지 링크를
  그대로 DB에 저장 → 제공자 측에서 URL 구조를 바꾸면 일괄 깨진다. 스토리지에
  복사해 두는 전략 부재.

### 스키마 / 메타데이터
- **장르/활동 시기/데뷔 등 프로필 필드 없음.** MusicBrainz의 `country`,
  `type` 등도 저장하지 않는다.
- **동명이인 구분 수단 없음.** MBID가 있으면 유일하지만, KOPIS 경로로 만들어진
  아티스트는 MBID가 비어 충돌 감지 불가.
- **삭제/비활성 플래그 없음.** 잘못 생성된 아티스트를 안전하게 퇴출하는 경로가
  없다 (구독/공연 참조 때문에 물리 삭제도 위험).
