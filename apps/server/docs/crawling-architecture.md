# 크롤링 아키텍처

## 전체 파이프라인

`scheduler.ts`에서 node-cron으로 스케줄링하며, 다음 순서로 실행된다:

```
크롤링 → 장르 분류 → 아티스트 매칭 → 알림 발송
```

### 스케줄

| 플랫폼 | cron 표현식 | 실행 시점 |
|--------|------------|----------|
| 인터파크 | `0,30 * * * *` | 매시 0분, 30분 |
| YES24 | `10,40 * * * *` | 매시 10분, 40분 |
| 멜론 | `20,50 * * * *` | 매시 20분, 50분 |
| 티켓 오픈 리마인더 | `0 0 * * *` | 매일 자정 (UTC) |

### 파이프라인 단계 (`runCrawlPipeline`)

1. 크롤러 실행 (`BaseCrawler.run()`)
2. 미분류 공연 장르 재분류 (`classifyUnclassifiedConcerts()`)
3. 미매칭 공연 아티스트 매칭 (`matchUnmatchedConcerts()`)
4. 새로 매칭된 공연에 대해 구독자 알림 발송 (`notifyNewConcerts()`)

---

## 플랫폼별 크롤러

### 공통 (`BaseCrawler`)

파일: `src/crawlers/base.crawler.ts`

- 추상 클래스로 모든 플랫폼 크롤러의 베이스
- Axios 인스턴스: 15초 타임아웃, Chrome UA, 한국어 Accept-Language
- 요청 간 딜레이: 3000ms
- 재시도: 최대 3회, 지수 백오프 (2s → 4s → 6s)
- `run()` 메서드에서 중복 제거, DB 저장, CrawlLog 기록을 처리

### 인터파크 (`InterparkCrawler`)

파일: `src/crawlers/interpark.crawler.ts`

- **방식**: REST API (JSON 응답)
- **엔드포인트**: `https://tickets.interpark.com/contents/api/open-notice/notice-list`
- **파라미터**: `goodsGenre=ALL`, `goodsRegion=ALL`, `pageSize=50`, `sorting=OPEN_ASC`
- 가장 깔끔한 데이터 소스 — 장르 정보(`goodsGenreEngStr`) 포함
- `goodsCode`를 sourceId로 사용

### YES24 (`Yes24Crawler`)

파일: `src/crawlers/yes24.crawler.ts`

- **방식**: HTML 파싱 (AJAX 요청)
- **엔드포인트**: `https://ticket.yes24.com/New/Genre/Ajax/GenreListData.aspx`
- **페이지네이션**: 3페이지, 페이지당 20개
- `X-Requested-With: XMLHttpRequest` 헤더 필수
- `a[onclick*='jsf_base_GoToPerfDetail']`에서 공연 ID 추출
- 날짜 형식: `YYYY.MM.DD ~ YYYY.MM.DD` → `YYYY-MM-DD`로 변환

### 멜론 (`MelonCrawler`)

파일: `src/crawlers/melon.crawler.ts`

- **방식**: HTML 파싱 (멀티스테이지)
- 가장 복잡한 크롤러 — 3단계로 구성:
  1. **콘서트 페이지** (`/concert/index.htm`): 기본 공연 정보 수집
  2. **메인 페이지** (`/main/index.htm`): 추가 공연 수집, 인메모리 Set으로 중복 제거
  3. **상세 페이지**: 각 공연의 아티스트명 추출 (`.box_artist_checking .list_artist li strong.singer`)
- 상세 페이지 요청 간 2초 딜레이
- Referer 제한이 있어 tktapi.melon.com 직접 호출 불가

---

## 중복 제거

### DB 레벨

```prisma
@@unique([source, sourceId])
```

`(source, sourceId)` 복합 유니크 키로 동일 플랫폼 내 중복 방지. `BaseCrawler.run()`에서 `findUnique`로 확인 후 존재하면 스킵.

### 인메모리 (멜론)

멀티페이지 크롤 시 `Set<string>`으로 sourceId를 추적하여 동일 크롤 세션 내 중복 삽입 방지.

---

## 아티스트 매칭

파일: `src/crawlers/matcher.ts`

### 매칭 우선순위 (`matchArtist`)

1. **한글 이름 정확 매칭**: NFC 정규화, 공백 제거, 소문자 변환 후 비교. 긴 이름 우선 매칭 (2자 이상)
2. **영문 이름 매칭**: 4자 이하는 word boundary 정규식 적용 (`(?:^|[\s\[\(\-])name(?:$|[\s\]\)\-'"])`) — "BTS"가 "BTSMILE"에 매칭되는 것 방지
3. **별칭(alias) 매칭**: 영문 이름과 동일한 word boundary 로직
4. **접미사 제거 후 재시도**: "콘서트", "공연", "투어", "리사이틀" 등 제거 후 1~3번 재시도

### 아티스트명 추출 (`extractArtistName`)

매칭 실패 시 공연 제목에서 아티스트명 추출:

1. 특수 괄호/따옴표 콘텐츠 제거 (〈〉, 《》, 「」, 【】 등)
2. 지역 접미사 제거 ("- 서울", "- 부산" 등)
3. 콜론 기반 부제 제거
4. 연도 접두사 제거 ("2026 아이유" → "아이유")
5. 키워드 기반 분리 (콘서트, 투어, LIVE, WORLD 등)
6. 비-아티스트 패턴 필터링 (뮤지컬, 페스티벌, 오케스트라, 극장명 등)
7. 유효성 검증: 2~30자

### 미매칭 공연 처리 (`matchUnmatchedConcerts`)

1. `artistId = null`인 공연 조회
2. `matchArtist()`로 기존 아티스트 매칭 시도
3. 실패 시 `extractArtistName()`으로 이름 추출
4. 추출된 이름이 DB에 없으면 새 Artist 레코드 생성 (언어 자동 감지)
5. 공연에 artistId 업데이트

### 아티스트 캐시

- 글로벌 변수로 아티스트 목록 캐시 (`cachedArtists`)
- 최초 `loadArtists()` 호출 시 로드
- 새 아티스트 생성 후 `clearArtistCache()`로 무효화

---

## 장르 분류

파일: `src/crawlers/matcher.ts` (`classifyGenre`)

키워드 정규식 기반으로 공연 제목에서 장르를 판별한다:

| 장르 | 매칭 키워드 |
|------|-----------|
| MUSICAL | 뮤지컬, musical |
| CLASSIC | 클래식, 오케스트라, 교향, symphony, 리사이틀, recital, 가곡, 오페라, chamber |
| HIPHOP | 힙합, hiphop, hip-hop, 랩, rapper, rap, r&b, 알앤비 |
| TROT | 트롯, 트로트, 미스터트롯, 현역가왕, trot |
| FESTIVAL | 페스티벌, festival, 페스타, 뮤직페스티벌 |
| FANMEETING | 팬미팅, fanmeeting, fan meeting |
| CONCERT | 기본값 (위 어디에도 해당하지 않을 때) |

`classifyUnclassifiedConcerts()`는 genre=CONCERT인 공연을 재검사하여 정확한 장르로 업데이트한다.

---

## 알림 발송

파일: `src/services/notification.service.ts`

### 새 공연 알림 (`notifyNewConcerts`)

1. 새로 매칭된 공연 중 아직 NEW_CONCERT 알림을 보내지 않은 것 필터링
2. 해당 아티스트의 구독자 조회
3. DB에 Notification 레코드 생성
4. FCM 푸시 발송

```
제목: "{아티스트명} 새 공연!"
본문: "{공연 제목}"
이미지: 공연 포스터
데이터: { type: "NEW_CONCERT", concertId, artistId, url: "/artist/{artistId}" }
```

### 티켓 오픈 리마인더 (`sendTicketOpenReminders`)

- 매일 자정 실행
- `ticketOpenDate`가 오늘인 공연 조회
- 중복 리마인더 방지 (이미 TICKET_OPEN_SOON 알림이 있으면 스킵)

```
제목: "오늘 티켓 오픈!"
본문: "{아티스트명} - {공연 제목}"
URL: 외부 예매 링크 (sourceUrl)
```

---

## CrawlLog 추적

```prisma
model CrawlLog {
  id          String       @id @default(cuid())
  source      TicketSource           // MELON | YES24 | INTERPARK
  startedAt   DateTime     @default(now())
  completedAt DateTime?
  itemsFound  Int          @default(0)  // 총 수집 건수
  newItems    Int          @default(0)  // 신규 저장 건수
  errors      String?                   // 에러 메시지
  status      CrawlStatus              // RUNNING | SUCCESS | FAILED
}
```

`BaseCrawler.run()`에서:
- 시작 시 RUNNING 상태로 생성
- 완료 시 SUCCESS/FAILED + itemsFound, newItems, errors 업데이트

---

## 데이터 흐름 다이어그램

```
┌─────────────────────────────────────────────┐
│  SCHEDULER (node-cron)                      │
└──────────────────┬──────────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
 [INTERPARK]   [YES24]      [MELON]
 (API JSON)  (HTML AJAX)  (HTML 3-stage)
     │             │             │
     └─────────────┼─────────────┘
                   ▼
     ┌─────────────────────────┐
     │  BaseCrawler.run()      │
     │  - 중복 제거            │
     │  - DB 저장              │
     │  - CrawlLog 기록        │
     └────────────┬────────────┘
                  ▼
     ┌─────────────────────────┐
     │  장르 재분류             │
     │  (CONCERT → 정확한 장르) │
     └────────────┬────────────┘
                  ▼
     ┌─────────────────────────┐
     │  아티스트 매칭           │
     │  - 기존 아티스트 매칭    │
     │  - 이름 추출 & 생성     │
     └────────────┬────────────┘
                  ▼
     ┌─────────────────────────┐
     │  알림 발송               │
     │  - 구독자 조회           │
     │  - Notification 생성    │
     │  - FCM 푸시              │
     └─────────────────────────┘
```

---

## 주요 파일 참조

| 파일 | 역할 |
|------|------|
| `src/crawlers/scheduler.ts` | 스케줄링 & 파이프라인 오케스트레이션 |
| `src/crawlers/base.crawler.ts` | HTTP 처리, 재시도, DB 저장, 중복 제거 |
| `src/crawlers/interpark.crawler.ts` | 인터파크 API 크롤러 |
| `src/crawlers/yes24.crawler.ts` | YES24 HTML 크롤러 |
| `src/crawlers/melon.crawler.ts` | 멜론 멀티스테이지 크롤러 |
| `src/crawlers/matcher.ts` | 아티스트 매칭, 이름 추출, 장르 분류 |
| `src/services/notification.service.ts` | 알림 생성 & FCM 푸시 발송 |
| `prisma/schema.prisma` | DB 스키마 (Concert, Artist, CrawlLog 등) |
