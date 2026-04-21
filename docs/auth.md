# 인증

## 카카오 OAuth 플로우 (웹)

1. 클라이언트 → `GET /auth/kakao` → 카카오 OAuth 페이지 리다이렉트
2. 카카오 → `GET /auth/kakao/callback?code=...` — code로 access_token 교환
3. access_token으로 카카오 사용자 프로필 조회
4. DB에 User upsert → JWT 생성 → httpOnly 쿠키(`token`) 설정 (30일)
5. 프론트엔드로 리다이렉트

## 모바일 OAuth (딥링크)

모바일 콜백은 쿠키 대신 딥링크로 토큰 전달:

```
concertalert://auth/callback?token=<jwt>
```

---

## JWT 설정

| 항목 | 값 |
|------|---|
| 쿠키 이름 | `token` |
| 옵션 | `httpOnly: true`, `sameSite: "lax"`, `path: "/"` |
| 만료 | 30일 |
| 서명 키 | `env.JWT_SECRET` |

---

## Fastify 인증 플러그인

`src/plugins/auth.ts` — `fastify.authenticate` 데코레이터 등록.

```typescript
// 모듈 전체 보호 (subscriptions, notifications 라우트 파일 최상단)
fastify.addHook("onRequest", fastify.authenticate);

// 개별 라우트 보호 (GET /performances/feed, GET /auth/me)
fastify.get("/me", { onRequest: [fastify.authenticate] }, handler);
```

---

## 필수 환경 변수

```env
KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback

JWT_SECRET=your-secret-key

# DB (URL 또는 개별 항목)
DATABASE_URL=postgresql://user:pass@localhost:5432/concert_alert
# 또는
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=concert_alert
DATABASE_USER=
DATABASE_PASSWORD=
```

`src/config/env.ts`에서 zod로 검증.  
`DATABASE_URL` 없으면 `DATABASE_*` 개별 항목 조합으로 빌드.
