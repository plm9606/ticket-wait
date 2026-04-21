# DB 스키마

PostgreSQL 16 + Prisma 6.

**중요 제약**: 물리적 FK constraint 없음 (`relationMode = "prisma"`). PK는 모두 `Int @id @default(autoincrement())`.

스키마 파일: `apps/server/prisma/schema.prisma`

---

## 테이블

### User

| 필드 | 타입 | 비고 |
|------|------|------|
| id | Int PK | |
| kakaoId | String unique | |
| nickname | String | |
| email | String? | |
| profileImage | String? | |

### Artist

| 필드 | 타입 | 비고 |
|------|------|------|
| id | Int PK | |
| name | String | 한글명 |
| nameEn | String? | 영문명 |
| aliases | String[] | 별칭 목록 (매칭용) |
| imageUrl | String? | |
| musicbrainzId | String? unique | MusicBrainz MBID (UUID) |
| appleMusicId | String? | |

### Venue

| 필드 | 타입 | 비고 |
|------|------|------|
| id | Int PK | |
| name | String | |
| kopisId | String unique | KOPIS 공연시설 코드 |
| address | String? | |
| lat, lng | Float? | 위경도 |
| seatScale | Int? | 좌석 규모 |
| sido, gugun | String? | 시도/구군 |

### Performance

| 필드 | 타입 | 비고 |
|------|------|------|
| id | Int PK | |
| title | String | |
| venueId | Int? | → Venue |
| startDate, endDate | DateTime? | |
| ticketOpenDate | DateTime? | |
| source | TicketSource | MELON\|YES24\|INTERPARK\|KOPIS |
| sourceId | String | 외부 플랫폼 ID |
| sourceUrl | String? | |
| kopisId | String? | KOPIS 고유 ID |
| genre | PerformanceGenre | CONCERT\|FESTIVAL\|MUSICAL\|CLASSIC\|FAN_MEETING\|... |
| status | PerformanceStatus | UPCOMING\|ON_SALE\|SOLD_OUT\|COMPLETED\|... |
| imageUrl | String? | |
| @@unique | [source, sourceId] | 중복 방지 복합 키 |

### PerformanceArtist (다대다 중간 테이블)

| 필드 | 타입 |
|------|------|
| performanceId | Int |
| artistId | Int |

### Subscription

| 필드 | 타입 | 비고 |
|------|------|------|
| id | Int PK | |
| userId | Int | → User |
| artistId | Int | → Artist |
| @@unique | [userId, artistId] | 중복 구독 방지 |

### FcmToken

| 필드 | 타입 | 비고 |
|------|------|------|
| id | Int PK | |
| userId | Int | → User |
| token | String unique | FCM 등록 토큰 |
| device | String? | |

### Notification

| 필드 | 타입 | 비고 |
|------|------|------|
| id | Int PK | |
| userId | Int | → User |
| performanceId | Int | → Performance |
| type | NotificationType | NEW_CONCERT\|TICKET_OPEN_SOON |
| sentAt | DateTime | |
| readAt | DateTime? | null = 미읽음 |

### SyncLog

| 필드 | 타입 | 비고 |
|------|------|------|
| id | Int PK | |
| source | String | |
| startedAt | DateTime | |
| completedAt | DateTime? | |
| itemsFound | Int | |
| newItems | Int | |
| updatedItems | Int | |
| status | SyncStatus | SUCCESS\|PARTIAL\|FAILED |

### SyncDlq (Dead Letter Queue)

매칭 실패한 공연 수동 처리용.

| 필드 | 타입 | 비고 |
|------|------|------|
| id | Int PK | |
| kopisId | String | |
| reason | String | 매칭 실패 사유 |
| rawData | Json | KOPIS 원본 데이터 |
| resolvedAt | DateTime? | |
| resolvedArtistId | Int? | 수동 매핑 아티스트 ID |

---

## DB 관련 명령어

```bash
pnpm db:migrate       # Prisma 마이그레이션 실행
pnpm db:seed          # 개발용 시드 데이터
pnpm db:studio        # Prisma Studio (GUI)
```
