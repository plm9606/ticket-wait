# API 엔드포인트

서버 기본 URL: `http://localhost:4000` (개발) / `NEXT_PUBLIC_API_URL` (프로덕션)

Auth 필요(✓) 라우트는 JWT가 `token` httpOnly 쿠키에 있어야 함.

---

## 인증

| Method | Path | Auth | 설명 |
|--------|------|:----:|------|
| GET | `/auth/kakao` | — | 카카오 OAuth 리다이렉트 |
| GET | `/auth/kakao/callback` | — | OAuth 콜백 처리 |
| POST | `/auth/logout` | — | 로그아웃 (쿠키 삭제) |
| GET | `/auth/me` | ✓ | 현재 사용자 정보 |

## 아티스트

| Method | Path | Auth | 설명 |
|--------|------|:----:|------|
| GET | `/artists/search?q=&limit=` | — | 아티스트 검색 |
| GET | `/artists/:id` | — | 아티스트 상세 |

## 공연

| Method | Path | Auth | 설명 |
|--------|------|:----:|------|
| GET | `/performances?genre=&status=&limit=&cursor=` | — | 공연 목록 |
| GET | `/performances/:id` | — | 공연 상세 |
| GET | `/artists/:id/performances` | — | 아티스트별 공연 |
| GET | `/performances/feed?limit=&cursor=` | ✓ | 구독 아티스트 공연 피드 |

## 구독

| Method | Path | Auth | 설명 |
|--------|------|:----:|------|
| GET | `/subscriptions` | ✓ | 구독 목록 |
| POST | `/subscriptions` | ✓ | 구독 (`{ artistId }`) |
| DELETE | `/subscriptions/:artistId` | ✓ | 구독 해제 |
| GET | `/subscriptions/check/:artistId` | ✓ | 구독 여부 확인 |

## 알림

| Method | Path | Auth | 설명 |
|--------|------|:----:|------|
| POST | `/notifications/register-token` | ✓ | FCM 토큰 등록 |
| GET | `/notifications/history?limit=&cursor=` | ✓ | 알림 히스토리 |
| PATCH | `/notifications/:id/read` | ✓ | 읽음 처리 |
| GET | `/notifications/unread-count` | ✓ | 안읽은 알림 수 |

---

## 공통 패턴

### 커서 페이지네이션 응답

```json
{
  "items": [...],
  "nextCursor": 42
}
```

`nextCursor`가 `null`이면 마지막 페이지. 최대 50개/요청 (`Math.min(limit, 50)` 강제).

### 에러 응답

```json
{ "statusCode": 404, "message": "Artist not found" }
```

### Fastify 인증 적용 방식

```typescript
// 모듈 전체 보호 (subscriptions, notifications 라우트 파일 최상단)
fastify.addHook("onRequest", fastify.authenticate);

// 개별 라우트 보호
fastify.get("/me", { onRequest: [fastify.authenticate] }, handler);
```

→ 인증 플로우 상세: [auth.md](auth.md)
