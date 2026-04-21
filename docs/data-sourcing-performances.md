# 공연 데이터 수급

## 소스

**KOPIS 공연예술통합전산망 OpenAPI** (`http://www.kopis.or.kr/openApi/restful`) 단일 소스.
공공 API 키는 `KOPIS_KEY` 환경변수. 응답은 XML이며 `fast-xml-parser`로 파싱.

| 엔드포인트 | 용도 | 사용처 |
|------------|------|--------|
| `GET /pblprfr` | 공연 목록(요약) | `KopisAdapter.listPerformances()` |
| `GET /pblprfr/{mt20id}` | 공연 상세 | `KopisAdapter.getPerformance()` |
| `GET /prfplc` | 공연시설(Venue) 목록 | `KopisAdapter.listFacilities()` |
| `GET /prfplc/{mt10id}` | 공연시설 상세 | `KopisAdapter.getFacility()` |

DTO 타입과 포트 인터페이스는 `apps/server/src/ports/out/kopis.port.ts`,
`openapi/KOPIS.yml` 명세가 원본. 규칙은 `.claude/rules/kopis.md` 참조.

## 수집 필드

### Performance (`Performance` 모델)

| DB 필드 | KOPIS 소스 | 비고 |
|---------|-----------|------|
| `kopisId` | `mt20id` | KOPIS 공연 ID |
| `title` / `rawTitle` | `prfnm` | 공연명 (원본 보존) |
| `startDate` / `endDate` | `prfpdfrom`, `prfpdto` | `YYYY.MM.DD` → `Date` |
| `status` | `prfstate` | `01→UPCOMING`, `02→ON_SALE`, `03→COMPLETED` |
| `genre` | `shcate` + 제목 키워드 | 아래 "장르 매핑" 참조 |
| `imageUrl` | `poster` | `http://` → `https://` 자동 변환 |
| `source` / `sourceId` / `sourceUrl` | `relates[]` | 아래 "예매처 분기" 참조 |
| `venueId` | `mt10id` | `Venue` 테이블과 조인 |
| (관계) `performanceArtists` | `prfcast` 파싱 | 아래 "아티스트 매칭" 참조 |
| `ticketOpenDate` | — | **현재 미수집** (KOPIS는 티켓 오픈일을 제공하지 않음) |

### Venue (`Venue` 모델)

| DB 필드 | KOPIS 소스 |
|---------|-----------|
| `kopisId` | `mt10id` |
| `name` | `fcltynm` |
| `address`, `lat`, `lng` | `adres`, `la`, `lo` |
| `seatScale`, `phone`, `website` | `seatscale`, `telno`, `relateurl` |
| `sido`, `gugun` | `sidonm`, `gugunnm` |

### 예매처 분기 (하나의 KOPIS 공연 → 여러 Performance 행)

`PerformanceDetail.relates[]`의 `relatenm`을 문자열 매칭으로 `TicketSource`
(`MELON` / `YES24` / `INTERPARK`)에 매핑. 매핑된 링크마다 별도 `Performance` 레코드를
생성한다. 매핑 실패한 링크(예: 티켓링크 등)는 현재 저장하지 않는다.
`sourceId`는 URL 패턴에서 추출 (예: YES24 `/Perf/(\w+)`, 멜론 `?prodId=`).

### 장르 매핑 (`application/sync/kopis-sync.service.ts` + `genre-classifier.ts`)

1. KOPIS 장르 코드(`shcate`) 기본 매핑:
   - `CCCD` 대중음악 → `CONCERT` (후속 재분류 대상)
   - `GGGA` 뮤지컬 → `MUSICAL`
   - `CCCA` 클래식 → `CLASSIC`
   - `AAAA` 연극 → `OTHER`
2. `CCCD`인 경우 공연 제목 키워드로 세분화: `MUSICAL` / `CLASSIC` / `HIPHOP` /
   `TROT` / `FESTIVAL` / `FANMEETING` / `CONCERT`(기본값).

동기화 대상은 현재 `CCCD, GGGA, CCCA, AAAA` 4개 코드로 한정
(`SYNC_GENRE_CODES`). 무용(`BBBC`), 국악(`CCCC`), 복합/서커스(`EEEA/EEEB`)는
수집하지 않는다.

## 데이터 구조 (스키마 핵심)

```prisma
model Performance {
  id             Int              @id @default(autoincrement())
  title          String
  rawTitle       String
  kopisId        String?
  venueId        Int?
  startDate      DateTime?
  endDate        DateTime?
  ticketOpenDate DateTime?                   // 현재 null (미수집)
  source         TicketSource                // MELON | YES24 | INTERPARK
  sourceId       String
  sourceUrl      String
  imageUrl       String?
  genre          PerformanceGenre
  status         PerformanceStatus
  performanceArtists PerformanceArtist[]     // N:M
  @@unique([source, sourceId])               // 중복 방지 키
  @@index([kopisId])
}

model Venue { kopisId String @unique ... }
model PerformanceArtist { performanceId Int, artistId Int @@id([...]) }
```

중복 제거는 DB 레벨 복합 유니크 키 `(source, sourceId)`에 위임.
Upsert는 `application/sync/performance-upsert.ts`가 수행한다.

## 동기화 전략

### 진입점

- **스케줄러**: `apps/server/src/crawlers/scheduler.ts` — node-cron
  - `0 18 * * *` UTC (= **매일 새벽 3시 KST**): `syncVenues()` → `syncPerformances()`
  - `0 0 * * *` UTC (= 매일 오전 9시 KST): `notificationService.sendTicketOpenReminders()`
- **CLI**: `pnpm sync:performances` → `src/scripts/sync-performances.ts` (1회성 실행)

### Venue 동기화 (`KopisSyncService.syncVenues`)

- 증분 수집: `findLastSuccess("KOPIS_VENUE").startedAt`을 `afterdate` 파라미터로
  전달 → 그 이후 등록/수정된 시설만 조회.
- 목록 → 상세 2단계 호출, 페이지당 100건, 마지막 페이지 감지 시 종료.
- 매 실행마다 `SyncLog`(`source="KOPIS_VENUE"`)에 `itemsFound / newItems /
  updatedItems` 집계.

### Performance 동기화 (`KopisSyncService.syncPerformances`)

- **날짜 윈도우**: 오늘부터 +90일까지 30일 단위로 쪼개 3개 윈도우 생성
  (`buildDateWindows()`).
- **이중 루프**: `(장르 4개 × 날짜 윈도우 3개)` = 12개 쿼리 조합, 각 조합마다
  페이지당 100건씩 페이지네이션.
- **상세 조회**: 목록 각 항목에 대해 `getPerformance(mt20id)` 개별 호출
  (캐스트/예매처 링크를 얻기 위해).
- **Venue 캐싱**: 실행 내 `Map<mt10id, venueId>`로 중복 호출 방지. DB에 없는
  시설은 상세를 조회해 upsert.
- **체크포인트 재개**: `(genreIndex, windowIndex)`를 `SyncLog.checkpoint`
  (JSON 문자열)에 저장. 실패한 로그가 있으면 다음 실행이 체크포인트부터 재개.
- **알림 트리거**: 신규 저장된 Performance ID를 모아
  `INotificationUseCase.notifyNewPerformances()`로 푸시 발송.

### 아티스트 매칭 (수집 시점)

`PerformanceDetail.prfcast`를 `,` / `、` / `，`로 쪼개 각 이름마다:

1. `IArtistRepository.findByName(name)` 정확 매칭
2. 매칭 실패 시 `ICreateArtistUseCase.execute(name)`으로 **신규 아티스트 자동
   생성** (MusicBrainz/Apple Music 연계 — 자세한 내용은
   [data-sourcing-artists.md](./data-sourcing-artists.md))

`prfcast` 또는 `prfnm`이 비어 있으면 DLQ(`SyncDlq`)에 원본을 보관하고 스킵.

### Dead Letter Queue (`SyncDlq`)

```prisma
model SyncDlq {
  kopisId          String    @unique
  reason           String
  rawData          Json
  resolvedAt       DateTime?
  resolvedArtistId Int?
}
```

- `kopisId` 기준 upsert. 같은 건이 다시 들어오면 `reason/rawData` 갱신.
- 현재 트리거 조건은 `prfnm/prfcast` 누락 1가지. 다른 파싱 에러는 아직 DLQ에
  쌓이지 않는다.

## 배치 주기 요약

| 작업 | 스케줄 (UTC → KST) | 소요 예측 |
|------|-------------------|----------|
| Venue 동기화 (증분) | 매일 18:00 → 03:00 KST | 초기 1회 풀 스캔 후 증분이라 짧음 |
| Performance 동기화 | Venue 직후 | 장르 4 × 윈도우 3 × 페이지 × 상세 API 호출, 수백~수천 건 기준 수 분 단위 |
| 티켓 오픈 리마인더 | 매일 00:00 → 09:00 KST | DB 쿼리만 |

## 아직 부족한 부분

### 데이터 품질
- **`ticketOpenDate` 미수집**: KOPIS가 티켓 오픈일을 노출하지 않아 스키마 컬럼만
  있고 실제 값은 비어 있다. 결과적으로 "티켓 오픈 리마인더"는 현재 동작하지
  않는 상태. 각 예매처(YES24/멜론/인터파크) 개별 스크랩이 필요.
- **상태 자동 갱신 없음**: `status`는 `prfstate` 수집 시점 값으로 고정. 공연
  종료/매진 상태가 시간이 지나도 갱신되지 않는다.
- **가격(`pcseguidance`), 런타임, 줄거리 등 메타데이터 미활용**: DTO에는
  들어오지만 DB 컬럼이 없어 버려진다.
- **매핑 누락된 예매처 상실**: `relates[]`에서 티켓링크 등 비지원 사이트는
  아예 저장되지 않는다. 결과적으로 "공연은 있는데 예매 링크가 없는" 데이터가
  필터링되어 누락될 수 있다.

### 크롤링 범위
- **장르 편향**: `CCCD/GGGA/CCCA/AAAA`만 수집. 무용·국악·서커스 등 누락.
- **윈도우 고정 (+90일)**: 3개월 뒤 공연은 다음 실행까지 나타나지 않음. 장기
  예매 공연 추적이 불가.
- **증분 수집 미적용 (Performance)**: Venue는 `afterdate`로 증분이지만
  Performance는 매일 풀 윈도우 재스캔 → API 호출량이 크고 오탐 리스크.

### 운영
- **스케줄러 단일 노드**: node-cron을 `buildApp()` 이후 `startScheduler()`로
  프로세스 내 실행. 다중 인스턴스로 배포하면 **중복 실행된다**. 분산 락 / 외부
  잡 큐 없음.
- **DLQ 관리 UI/스크립트 없음**: `SyncDlq`에 쌓인 항목을 재처리하거나 해소하는
  도구가 없다. `resolvedArtistId` 필드만 존재하고 쓰이지 않음.
- **KOPIS API 레이트리밋 대응 없음**: `axios` 기본값만 사용. 상세 조회가
  공연 수만큼 발생해 일일 할당량을 소모한다.
- **실패 알림 경로 없음**: `markFailed`로 로그만 남기고 오퍼레이터에게
  알림을 보내지 않는다.
- **낡은 `crawl:test` 참조**: `package.json`에 `pnpm crawl:test`가 있으나
  대상 파일(`src/crawlers/test.ts`)이 존재하지 않음. 루트 `CLAUDE.md`와
  `README.md`, `apps/server/CLAUDE.md`에도 참조가 남아 있다.
- **`apps/server/docs/crawling-architecture.md`는 stale**: 과거 Interpark/
  YES24/Melon 직접 크롤러 아키텍처를 설명하며 현재 코드와 일치하지 않는다.
