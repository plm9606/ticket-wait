Backstage 디자인 리뉴얼 계획

Context

Stitch MCP에서 디자인한 4개 화면(Home & Explore, Concert Details, Alerts & Settings, 아티스트 선택)을 현재 Next.js 프론트엔드에 적용한다. 앱 이름을 “Backstage”로 변경하고, “Quiet Luxury” 모노크롬 에디토리얼 디자인 시스템을 적용한다. UI 언어는 한국어 유지, 백엔드에 없는 데이터는 더미/placeholder로 표시한다.

디자인 핵심 원칙

모노크롬 팔레트: primary #000, surfaces #f9f9fb/#f3f3f5/#ffffff
폰트: Manrope (헤드라인) + Inter (본문) + Pretendard (한국어 fallback)
No borders: 1px 선 대신 surface 색상 차이로 구분
Glassmorphism: 헤더/하단 네비에 backdrop-blur
Roundness: 8px (카드/컨테이너), 9999px (칩/뱃지)
CTA gradient: #000 → #3b3b3b
Phase 1: 디자인 토큰 & 레이아웃 기반

1-1. globals.css 재설계
파일: 
apps/web/src/styles/globals.css

@theme 블록에 surface 색상 체계 추가:
--color-surface: #f9f9fb, --color-surface-low: #f3f3f5, --color-surface-lowest: #ffffff
--color-surface-container: #eeeef0, --color-surface-dim: #d9dadc
--color-outline: #c6c6c6, --color-outline-strong: #777777
--color-on-surface: #1a1c1d, --color-on-surface-variant: #474747
기존 gray 스케일 유지 (호환성) + 새 surface 토큰 추가
.btn-primary 유틸리티: background: linear-gradient(135deg, #000, #3b3b3b), 흰색 텍스트, rounded-lg
.glass 유틸리티: bg-white/80 backdrop-blur-[20px]
body 배경을 #f9f9fb로 변경
기존 애니메이션 및 유틸리티 보존: @keyframes fade-in, slide-up, .stagger-1~4, .line-clamp-2, .no-select, 스크롤바 스타일링, hover transition
1-2. 폰트 설정
파일: 
apps/web/src/app/layout.tsx

next/font/google에서 Manrope, Inter import
Pretendard는 한국어 fallback으로 유지
--font-headline, --font-body CSS 변수 설정
metadata title을 “Backstage - 좋아하는 아티스트의 공연을 놓치지 마세요”로 변경
apps/web/src/styles/fonts.ts 삭제 (dead code — 어디서도 import되지 않음)
1-3. Header 리디자인
파일: 
apps/web/src/components/layout/Header.tsx

앱 이름: “Backstage” (Manrope 폰트, 볼드)
텍스트 네비 제거 → 아이콘 기반: 검색(돋보기, `/search`로 라우팅), 알림(벨+뱃지), 프로필(원형 아바타)
스타일: .glass 적용, border-b 제거
아이콘: lucide-react 패키지 추가 (Search, Bell, User 아이콘)
1-4. BottomNav 리디자인
파일: 
apps/web/src/components/layout/BottomNav.tsx

탭 변경: Home(
/
), Explore(
/concerts
), Alerts(
/my/notifications
), Profile(
/my
)
이모지 아이콘 → lucide-react SVG 아이콘 (Home, Compass, Bell, User)
.glass 적용, border-t 제거
활성 상태: 아이콘 filled + 볼드 라벨
1-5. 공통 UI 컴포넌트 생성
새 파일들 (apps/web/src/components/ui/):

GradientButton.tsx - 그라데이션 CTA 버튼
SurfaceCard.tsx - surface 배경 카드 (border 없음, rounded-lg, p-6)
Badge.tsx - 색상 라벨 (PRESALE, SOLD OUT, NEW 등)
FilterPill.tsx - 장르 필터 pill (active: bg-black text-white, inactive: surface 배경)
AvatarCircle.tsx - 원형 아바타 (이미지 + fallback 이니셜)
의존성 추가: lucide-react (아이콘 라이브러리)

Phase 2: 홈 페이지 (Screen 1)

2-1. 홈 페이지 완전 재작성
파일: 
apps/web/src/app/page.tsx

기존 구조 (히어로 + 서비스 소개 + 최근 공연) → 새 구조:

검색바: 상단에 “아티스트, 공연, 장소 검색…” placeholder, surface-lowest 배경, 클릭시 
/search
로 이동
장르 필터 pills: 가로 스크롤, FilterPill 컴포넌트 사용 (전체, 콘서트, 페스티벌, 팬미팅…)
“맞춤 추천” 섹션 (Upcoming for You):
로그인 시: 
/concerts/feed
 API → 가로 스크롤 카드
비로그인 시: “로그인하고 맞춤 추천 받기” CTA
카드: 이미지 배경 + 그라데이션 오버레이 + 제목/아티스트/날짜
“인기 공연” 섹션 (Popular Near You → 인기 공연):
/concerts?limit=10
 API → 넘버링된 대형 카드 (01, 02, 03…)
카드: 좌측 번호 + 이미지 + 제목/장소/날짜 + “알림 받기” 버튼
2-2. 새 컴포넌트
components/home/SearchBar.tsx
 - 검색 입력 UI (라우팅만, 실제 검색은 /search에서)
components/home/UpcomingForYou.tsx
 - 가로 스크롤 추천 카드 섹션
components/home/TrendingConcerts.tsx
 - 넘버링 인기 공연 카드
components/concert/ConcertCard.tsx
 - 재사용 가능한 공연 카드 (여러 변형: horizontal, vertical, numbered)
2-3. RecentConcerts 컴포넌트 업데이트
파일: 
apps/web/src/components/concert/RecentConcerts.tsx

새 ConcertCard 컴포넌트를 사용하도록 리팩터링
2-4. 검색 페이지 스타일 업데이트
파일: apps/web/src/app/search/page.tsx

border-b-2 border-black → surface-lowest 배경 + 하단 포커스 라인 (2px primary)
font-light 텍스트 → Manrope 헤드라인 + Inter 본문 적용
기존 검색 로직(디바운스, API 호출) 유지, 스타일만 변경
Phase 3: 공연 상세 페이지 (Screen 2)

파일: 
apps/web/src/app/concerts/[id]/page.tsx

현재 (가운데 정렬 포스터 + 텍스트) → 새 구조:

풀폭 히어로 이미지: Container 외부에서 렌더링 (Container 진입 전에 히어로 이미지 배치, Container는 메타 정보부터 시작), 하단 그라데이션 페이드
뒤로가기 버튼: 히어로 이미지 좌상단 오버레이
공연 제목: Manrope 대형 타이포 (text-3xl font-bold)
메타 정보 행: 날짜 · 장소 · 런타임(placeholder “약 120분”)
티켓 상태 표시:
ON_SALE → “티켓 판매중” Badge
SOLD_OUT → “매진” Badge
UPCOMING → “티켓 오픈 예정” Badge
가격 영역: placeholder “가격 정보 확인” 텍스트
“예매하기” CTA: GradientButton (풀폭)
“공연 소개” 섹션: placeholder 텍스트 + 장소/날짜 정보 편집
아티스트 섹션: 원형 AvatarCircle + 이름/영문명 + 구독 버튼
Phase 4: 공연 목록 페이지

파일: 
apps/web/src/app/concerts/page.tsx

기존 리스트형 → 카드형 그리드로 변경
FilterPill 공통 컴포넌트 사용 (홈과 동일 스타일)
카드: Phase 2의 ConcertCard 컴포넌트 재사용 (vertical 변형) + SurfaceCard 배경
border 제거 → surface 배경색 차이로 구분
스켈레톤: surface 색상으로 교체
Phase 5: 알림 페이지 (Screen 3)

파일: 
apps/web/src/app/my/notifications/page.tsx

현재 (단순 리스트) → 새 구조:

헤더: “알림” 제목 + “맞춤 알림으로 공연을 놓치지 마세요” 부제
채널 설정 섹션:
Push 토글 (활성)
Email 토글 (비활성, “준비중” 표시)
SMS 토글 (비활성, “준비중” 표시)
필터 검색바: 아티스트/장소로 알림 필터링 (클라이언트사이드)
“예정” 섹션:
읽지 않은 알림 + UPCOMING/ON_SALE 상태 공연
카드: 날짜 뱃지 (월/일) + 공연명 + 장소 + 시간 + 위치 태그
Badge: “새 공연” → 파란 뱃지, “티켓 오픈” → 초록 뱃지
“지난 알림” 섹션: 읽은 알림 / COMPLETED/SOLD_OUT
“SOLD OUT” / “종료” Badge
새 컴포넌트
components/alerts/ChannelSettings.tsx
components/alerts/AlertCard.tsx
Phase 6: 프로필 & 설정

6-1. 프로필 페이지
파일: 
apps/web/src/app/my/page.tsx

구독 아티스트: 원형 AvatarCircle 그리드
SurfaceCard 적용
border 제거
6-2. 설정 페이지
파일: 
apps/web/src/app/settings/page.tsx

SurfaceCard 섹션으로 스타일 변경
divide-y 제거
6-3. 아티스트 상세 페이지 스타일 업데이트
파일: apps/web/src/app/artist/[id]/page.tsx

border border-gray-100 → SurfaceCard 적용
border-dashed 제거 → surface 배경색 차이로 구분
아티스트 프로필: AvatarCircle 컴포넌트 사용
구독 버튼: GradientButton 적용
Phase 7: 온보딩 - 아티스트 선택 (Screen 4)

7-1. 백엔드 - 인기 아티스트 API 추가
파일:
apps/server/src/infrastructure/http/artists/artist.route.ts
 (기존 파일에 추가)

GET /artists 엔드포인트 추가: 구독자 수 기준 정렬, limit 파라미터
검색어 없이 인기 아티스트 목록 반환
7-2. 온보딩 페이지 생성
새 파일: 
apps/web/src/app/onboarding/page.tsx

“당신만의 경험을 큐레이팅하세요” 헤더
“좋아하는 아티스트를 선택하면 맞춤 공연 알림을 보내드립니다” 부제
아티스트 검색바
3열 원형 아티스트 그리드 (AvatarCircle + 이름)
선택 상태: 테두리 하이라이트 + 체크마크
“큐레이팅 완료 →” GradientButton (선택된 아티스트 수 표시)
제출 시: 선택된 아티스트들에 대해 순차적으로 POST /subscriptions 호출 후 홈으로 이동

수정 파일 요약
| 파일 | 변경 유형 |
| :--- | :--- |
| apps/web/src/styles/globals.css | 대폭 수정 (디자인 토큰) |
| apps/web/src/app/layout.tsx | 수정 (폰트, 메타데이터) |
| apps/web/src/components/layout/Header.tsx | 재작성 |
| apps/web/src/components/layout/BottomNav.tsx | 재작성 |
| apps/web/src/app/page.tsx | 재작성 |
| apps/web/src/app/concerts/page.tsx | 대폭 수정 |
| apps/web/src/app/concerts/[id]/page.tsx | 대폭 수정 |
| apps/web/src/app/my/notifications/page.tsx | 재작성 |
| apps/web/src/app/my/page.tsx | 수정 |
| apps/web/src/app/settings/page.tsx | 수정 |
| apps/web/src/components/concert/RecentConcerts.tsx | 수정 |
| apps/web/src/components/ui/*.tsx | 신규 (5개) |
| apps/web/src/components/home/*.tsx | 신규 (3개) |
| apps/web/src/components/alerts/*.tsx | 신규 (2개) |
| apps/web/src/components/concert/ConcertCard.tsx | 신규 |
| apps/web/src/app/onboarding/page.tsx | 신규 |
| apps/server/src/routes/artists/search.ts | 수정 (GET /artists 추가) |
| apps/web/src/app/search/page.tsx | 수정 (스타일) |
| apps/web/src/app/artist/[id]/page.tsx | 수정 (스타일) |
| apps/web/src/styles/fonts.ts | 삭제 |
| apps/web/package.json | 수정 (lucide-react 추가) |


검증 방법

pnpm install 후 pnpm dev로 웹 앱 실행
각 페이지 육안 확인:
/
 → 검색바, 필터 pills, 추천/인기 공연 섹션
/concerts
 → 카드형 그리드 레이아웃
/concerts/:id
 → 풀폭 히어로, 그라데이션 CTA
/my/notifications
 → 채널 설정, Upcoming/Missed 그룹핑
/onboarding
 → 아티스트 그리드 선택
/search → surface 배경, 하단 포커스 라인 스타일
/artist/:id → SurfaceCard, AvatarCircle 적용 확인
모바일 뷰포트(390px)에서 레이아웃 확인
다크모드 없음 (라이트 전용) 확인
Stitch 스크린샷과 비교하여 디자인 일치도 확인