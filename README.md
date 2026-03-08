# 공연 알리미 (Concert Alert)

좋아하는 아티스트를 구독하면, 티켓 사이트에 새 공연이 등록될 때 푸시 알림을 받을 수 있는 서비스입니다.

멜론티켓, YES24, 인터파크 3곳에서 공연 데이터를 자동 크롤링하여 구독 아티스트와 매칭 후 알림을 발송합니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 모노레포 | pnpm workspaces + Turborepo |
| 서버 | Fastify 5 + TypeScript (ESM) |
| 프론트엔드 | Next.js 15 (App Router) + React 19 |
| DB | PostgreSQL 16 + Prisma ORM |
| 스타일 | Tailwind CSS 4 + Pretendard |
| 인증 | 카카오 OAuth + JWT (httpOnly cookie) |
| 푸시 알림 | Firebase Cloud Messaging |
| 크롤링 | axios + cheerio + node-cron |
| 상태관리 | zustand |

## 프로젝트 구조

```
gwangju/
├── apps/
│   ├── server/          # Fastify 백엔드
│   │   ├── prisma/      # 스키마, 마이그레이션, 시드
│   │   └── src/
│   │       ├── routes/       # auth, artists, subscriptions, concerts, notifications
│   │       ├── crawlers/     # melon, yes24, interpark, matcher, scheduler
│   │       ├── services/     # notification service
│   │       ├── plugins/      # Fastify 플러그인 (auth)
│   │       ├── lib/          # prisma, kakao, fcm 헬퍼
│   │       └── config/       # 환경변수
│   └── web/             # Next.js 프론트엔드
│       ├── public/      # manifest.json, firebase SW
│       └── src/
│           ├── app/          # 페이지 라우트
│           ├── components/   # layout, ui, concert, artist
│           ├── hooks/        # useAuth, useSubscriptions 등
│           ├── lib/          # api 클라이언트, constants, fcm
│           └── styles/       # globals.css
├── packages/
│   └── shared/          # 공유 타입, 유틸리티
├── docker-compose.yml   # PostgreSQL
└── turbo.json
```

## 시작하기

### 사전 요구사항

- Node.js 18+
- pnpm 10+
- Docker (PostgreSQL용)

### 설치

```bash
# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.example apps/server/.env

# PostgreSQL 시작
docker compose up -d

# DB 마이그레이션 + 시드
pnpm db:migrate
pnpm db:seed
```

### 환경변수 (.env)

```env
# Database
DATABASE_URL=postgresql://concert:concert_dev@localhost:5432/concert_alert

# 카카오 OAuth
KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback

# JWT
JWT_SECRET=your-secret-key

# Firebase (선택)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

### 개발 서버 실행

```bash
# 전체 실행 (서버 + 웹)
pnpm dev

# 개별 실행
pnpm --filter server dev   # http://localhost:4000
pnpm --filter web dev      # http://localhost:3000
```

### 크롤러 테스트

```bash
pnpm crawl:test
```

## 주요 기능

### 크롤링 & 매칭
- 인터파크 (JSON API), YES24 (HTML 파싱), 멜론티켓 (AJAX JSON)
- 30분 간격 자동 크롤링, 사이트별 10분 간격 분산
- 아티스트 매칭: 한글명 → 영문명 → 별명 → 정규화 매칭

### 페이지

| 경로 | 설명 |
|------|------|
| `/` | 홈 — 최근 등록 공연 |
| `/search` | 아티스트 검색 (실시간, 디바운싱 300ms) |
| `/artist/[id]` | 아티스트 상세 + 구독 + 공연 목록 |
| `/concerts` | 전체 공연 목록 |
| `/my` | 내 구독 아티스트 |
| `/my/notifications` | 알림 내역 |
| `/settings` | 푸시 설정, 로그아웃 |

### API

```
GET    /auth/kakao                    카카오 로그인
GET    /auth/kakao/callback           OAuth 콜백
POST   /auth/logout                   로그아웃
GET    /auth/me                       내 정보

GET    /artists/search?q=             아티스트 검색
GET    /artists/:id                   아티스트 상세

GET    /subscriptions                 내 구독 목록
POST   /subscriptions                 구독
DELETE /subscriptions/:artistId       구독 해제

GET    /concerts                      공연 목록
GET    /concerts/:id                  공연 상세
GET    /concerts/feed                 구독 아티스트 공연

POST   /notifications/register-token  FCM 토큰 등록
GET    /notifications/history         알림 내역
PATCH  /notifications/:id/read        읽음 처리
GET    /notifications/unread-count    안읽은 알림 수
```

## DB 스키마

- **User** — 카카오 OAuth 유저
- **Artist** — 아티스트 (이름, 영문명, 별명)
- **Concert** — 공연 (제목, 장소, 날짜, 출처, 상태)
- **Subscription** — 유저-아티스트 구독 (unique)
- **FcmToken** — 푸시 알림 토큰
- **Notification** — 알림 내역
- **CrawlLog** — 크롤링 실행 로그

## 스크립트

```bash
pnpm dev            # 개발 서버
pnpm build          # 프로덕션 빌드
pnpm lint           # 타입 체크
pnpm db:migrate     # DB 마이그레이션
pnpm db:seed        # 시드 데이터 (아티스트 100명+)
pnpm db:studio      # Prisma Studio
pnpm crawl:test     # 크롤러 테스트 실행
```
