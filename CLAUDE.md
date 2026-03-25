# Concert Alert — PRD & Tech Spec

## 프로젝트 개요

**Concert Alert**는 멜론티켓·YES24·인터파크 등 주요 티켓 플랫폼의 공연 정보를 자동 수집하여, 구독한 아티스트의 새 공연이 등록되면 푸시 알림을 보내주는 서비스이다.

핵심 가치: "좋아하는 아티스트의 공연을 놓치지 않게 해준다"

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 모노레포 | pnpm workspaces + Turborepo |
| 프론트엔드 | Next.js 15, React 19, Tailwind CSS 4, Zustand 5 |
| 백엔드 | Fastify 5, Prisma 6, PostgreSQL 16 |
| 크롤러 | cheerio (HTML 파싱), axios, node-cron (스케줄링) |
| 인증 | 카카오 OAuth → JWT (httpOnly cookie, 30일 만료) |
| 푸시 알림 | Firebase Cloud Messaging (FCM) |
| 공유 패키지 | `packages/shared` — 타입, 한글 정규화 유틸 |

---

## 모노레포 구조

```
warsaw/
├── apps/
│   ├── web/          # Next.js 프론트엔드 (포트 3000)
│   └── server/       # Fastify API 서버 (포트 4000)
├── packages/
│   └── shared/       # 공유 타입 & 유틸리티
├── docker-compose.yml  # PostgreSQL 16
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 화면 구성

### 1. 홈페이지 (`/`)
- 풀스크린 히어로: 검은 배경, 중앙 정렬 타이포그래피, 스크롤 유도 라인
- 최근 등록된 공연 섹션: 그리드 레이아웃, hover 시 이미지 확대
- 서비스 소개 ("How it works") 3단 구성
- ScrollFadeIn 애니메이션 (IntersectionObserver)

### 2. 검색 (`/search`)
- 실시간 아티스트 검색 (300ms 디바운스)
- 검색 결과: 프로필 이미지 + 이름(한/영)

### 3. 공연 목록 (`/concerts`)
- 장르 필터 (콘서트, 뮤지컬, 클래식, 페스티벌 등)
- 커서 기반 페이지네이션
- 이미지 + 제목 + 날짜 + 장소

### 4. 공연 상세 (`/concerts/[id]`)
- 공연 포스터, 아티스트 정보, 티켓 오픈일, 외부 예매 링크
- 아티스트 구독 버튼

### 5. 아티스트 상세 (`/artist/[id]`)
- 아티스트 프로필 + 구독 버튼
- 해당 아티스트의 공연 목록

### 6. 마이페이지 (`/my`)
- 구독 중인 아티스트 그리드

### 7. 알림 (`/my/notifications`)
- 읽음/안읽음 상태 구분
- 커서 기반 페이지네이션

### 8. 설정 (`/settings`)
- 계정 정보, 푸시 알림 설정, 로그아웃

---

## 주요 비즈니스 로직

### 크롤러 파이프라인

1. **스케줄링** (node-cron): 인터파크(매시 0/30분), YES24(10/40분), 멜론(20/50분)
2. **수집**: 각 플랫폼 API/HTML에서 공연 데이터 파싱
3. **중복 제거**: `(source, sourceId)` 유니크 키로 기존 공연 스킵
4. **아티스트 매칭** (`matcher.ts`):
   - 한글 이름 정확 매칭 (NFC 정규화, 긴 이름 우선)
   - 영문 이름 매칭 (짧은 이름은 word boundary 적용)
   - 별칭(alias) 매칭
   - 접미사 제거 후 재시도 (콘서트, 투어 등)
   - 정규식으로 제목에서 아티스트명 추출
   - 매칭 실패 시 새 아티스트 생성
5. **장르 분류**: 키워드 기반 (뮤지컬, 클래식, 힙합, 트로트, 페스티벌, 팬미팅)
6. **알림 발송**: 구독자 조회 → Notification 레코드 생성 → FCM 푸시

### 인증 플로우

1. 클라이언트 → `/auth/kakao` → 카카오 OAuth 페이지 리다이렉트
2. 카카오 → `/auth/kakao/callback` → code로 access_token 교환
3. access_token으로 카카오 사용자 프로필 조회
4. DB에 User upsert → JWT 생성 → httpOnly 쿠키 설정
5. 프론트엔드로 리다이렉트

### 구독 & 알림

- 구독: `POST /subscriptions` (artistId)
- 해제: `DELETE /subscriptions/:artistId`
- 새 공연 등록 시 해당 아티스트 구독자 전원에게 FCM 푸시
- 매일 자정: 티켓 오픈일 임박 알림 발송

---

## API 엔드포인트

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/auth/kakao` | - | 카카오 OAuth 리다이렉트 |
| GET | `/auth/kakao/callback` | - | OAuth 콜백 처리 |
| POST | `/auth/logout` | - | 로그아웃 (쿠키 삭제) |
| GET | `/auth/me` | O | 현재 사용자 정보 |
| GET | `/artists/search?q=&limit=` | - | 아티스트 검색 |
| GET | `/artists/:id` | - | 아티스트 상세 |
| GET | `/concerts?genre=&status=&limit=&cursor=` | - | 공연 목록 |
| GET | `/concerts/:id` | - | 공연 상세 |
| GET | `/artists/:id/concerts` | - | 아티스트별 공연 |
| GET | `/concerts/feed?limit=&cursor=` | O | 구독 아티스트 공연 피드 |
| GET | `/subscriptions` | O | 구독 목록 |
| POST | `/subscriptions` | O | 구독 |
| DELETE | `/subscriptions/:artistId` | O | 구독 해제 |
| GET | `/subscriptions/check/:artistId` | O | 구독 여부 확인 |
| POST | `/notifications/register-token` | O | FCM 토큰 등록 |
| GET | `/notifications/history?limit=&cursor=` | O | 알림 히스토리 |
| PATCH | `/notifications/:id/read` | O | 읽음 처리 |
| GET | `/notifications/unread-count` | O | 안읽은 알림 수 |

---

## DB 스키마 (핵심)

```
User          — id, kakaoId(unique), nickname, email?, profileImage?
Artist        — id, name, nameEn?, aliases[]
Concert       — id, title, artistId?, venue?, startDate?, endDate?, ticketOpenDate?,
                source(MELON|YES24|INTERPARK), sourceId, sourceUrl, imageUrl?,
                genre(CONCERT|FESTIVAL|...), status(UPCOMING|ON_SALE|...)
                @@unique([source, sourceId])
Subscription  — id, userId, artistId  @@unique([userId, artistId])
FcmToken      — id, userId, token(unique), device?
Notification  — id, userId, concertId, type(NEW_CONCERT|TICKET_OPEN_SOON), sentAt, readAt?
CrawlLog      — id, source, startedAt, completedAt?, itemsFound, newItems, errors?, status
```

---

## 프론트엔드 상태 관리

Zustand 스토어 3개:

| 스토어 | 상태 | 주요 메서드 |
|--------|------|------------|
| `useAuth` | user, loading | fetchUser(), logout() |
| `useSubscriptions` | subscriptions[], subscribedIds(Set) | fetch(), subscribe(), unsubscribe(), isSubscribed() |
| `useNotificationCount` | count | fetch() |

API 호출은 `lib/api.ts`의 래퍼 사용 (credentials: "include" 고정).

---

## 코드 스타일 & 컨벤션

- **언어**: TypeScript strict 모드, ES2022 타겟
- **프론트엔드 스타일링**: Tailwind CSS 유틸리티 클래스 인라인. 별도 CSS 파일 최소화
- **폰트**: Gothic A1 (Google Fonts), font-weight 300 기본
- **디자인 톤**: 뉴믹스커피/29cm 스타일 에디토리얼. 미니멀, 여백 중심, 작은 텍스트(`text-[11px]`~`text-[15px]`), `tracking-[0.2em]`~`[0.3em]` 자간
- **컴포넌트**: `"use client"` 디렉티브는 상태/이벤트가 필요한 컴포넌트에만. 서버 컴포넌트 우선
- **API 패턴**: Fastify route 등록 방식. 인증 필요 라우트에 `preHandler: [fastify.authenticate]` 데코레이터
- **페이지네이션**: 커서 기반 (offset 사용 안 함)
- **에러 처리**: UI에서는 try-catch + 빈 상태 표시. 서버에서는 Fastify error handler
- **커밋 메시지**: 한글, 변경 내용 요약 스타일

---

## 실행 방법

```bash
# DB 시작
docker compose up -d

# 의존성 설치 & DB 마이그레이션
pnpm install
pnpm db:migrate

# 개발 서버 실행 (web + server 동시)
pnpm dev
```

---

## 환경 변수

`.env.example` 참고. 주요 항목:
- `DATABASE_URL` — PostgreSQL 연결 문자열
- `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET` — 카카오 OAuth
- `JWT_SECRET` — JWT 서명 키
- `FIREBASE_*` — FCM 푸시 알림 (선택)
- `NEXT_PUBLIC_API_URL` — 프론트에서 API 서버 URL
