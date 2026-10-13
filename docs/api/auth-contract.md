# Auth contract (frontend ⇄ FastAPI)

Status: **proposed by the frontend** – the backend had no `/auth/*` or `/dashboard`
endpoints when this was written (`backend/app/core/security.py` is a placeholder).
Authentication is FastAPI + JWT; Supabase Auth is **not** used by the frontend.

All paths are under `/api/v1`. Bodies are JSON.

| Method | Path             | Auth   | Request                                              | Success response                                                                 |
|--------|------------------|--------|------------------------------------------------------|----------------------------------------------------------------------------------|
| POST   | `/auth/register` | none   | `{ email, password, full_name? }`                    | `201`. Either tokens (below) or any body – the client then calls `/auth/login`.  |
| POST   | `/auth/login`    | none   | `{ email, password }`                                | `200 { access_token, refresh_token, token_type?, expires_in? }`                  |
| POST   | `/auth/refresh`  | none   | `{ refresh_token }`                                  | `200 { access_token, refresh_token? }` (omit `refresh_token` if not rotating)    |
| GET    | `/health`        | none   | –                                                    | `200 { status: "ok", app }` (only used by the dashboard's connection chip).     |
| GET    | `/dashboard`     | Bearer | –                                                    | `200 { user?: { email, full_name?, role? }, ... }`                               |

Errors: FastAPI default – `{"detail": "message"}` or `{"detail": [{"loc": [...], "msg": "..."}]}`.
`401` on a protected route triggers one silent `/auth/refresh` + retry, then logout.

Notes for the backend
- If you prefer `OAuth2PasswordRequestForm` (form-encoded `username`/`password`), change `services/auth.ts` accordingly.
- Prefer delivering the refresh token as an `httpOnly; Secure; SameSite` cookie. The SPA currently keeps it in
  `localStorage` (access token is memory-only); see `frontend/src/services/api.ts`.
- CORS currently allows `*` with credentials; restrict origins before production.
- "Continue with Google" and "Forgot password" have no endpoints yet; the UI shows them as unavailable.

Dev mock: `npm run dev` serves these endpoints in the browser by default (dev builds only); set `VITE_AUTH_MOCK=false` to use a real backend.
The login form shows a generic "Incorrect email or password." for 400/401/403/422 responses, so the backend need not (and should not) say which field was wrong.
