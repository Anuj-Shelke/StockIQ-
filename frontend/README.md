# StockIQ Frontend

React 19 · TypeScript · Vite · Tailwind CSS 4 · Three.js / React Three Fiber / drei · Framer Motion · React Router.
Talks to the FastAPI backend (`/api/v1`) with JWT auth. No Streamlit, no Supabase Auth.

## Status: frontend only

This folder is a self-contained frontend. **There is no backend in this repository yet.** Everything that would
need one is served by a clearly-labelled, dev-only in-browser mock, so the whole UI can be demonstrated locally.

| Works now (no backend)                                                        | Needs the backend (not built yet)                                   |
|-------------------------------------------------------------------------------|---------------------------------------------------------------------|
| Cinematic scroll landing: money → growth → data → analysis → insight → burst  | Real accounts, password storage and JWT issuing                     |
| Bubble burst → login card reveal, hover interactions, video fallback          | Forgot-password / reset e-mail                                      |
| `/login`, `/signup`, `/forgot-password` (reset shows "not available yet")     | "Continue with Google"                                              |
| Route guards, session restore, silent token refresh, sign out (mock tokens)   | Portfolio, Risk Reality Check, stress tests, asset comparison       |
| `/dashboard` shell and navigation (feature pages are "Coming soon")           | Explainability, financial education, analysis history, review queue |
| Educational disclaimer everywhere it matters                                  | Live market data, saved analyses, notifications                     |

## Run

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173  (mock auth is ON by default in dev)
npm run build      # tsc -b && vite build
npm run preview    # serve the production build
npm run lint
```

An `.env` file is optional. `cp .env.example .env` only if you want to change `VITE_API_URL` / `VITE_AUTH_MOCK`.

## Mock authentication (dev only)

`npm run dev` replaces `window.fetch` for `/api/v1/*` with `src/services/mockBackend.ts`
(`MOCK_AUTH` in `src/services/api.ts` is the single switch). It is **never active in production builds**.

- **Sign up**: any well-formed email and a password with 8+ characters including a letter and a number.
- **Sign in**: any well-formed email and any non-empty password.
- **Failure case**: the password `invalid123` is rejected, so you can see the generic "Incorrect email or password." message.
- Tokens are fake strings held exactly like real ones (access token in memory, refresh token in `localStorage`),
  so reload-to-restore, 401 → refresh → retry and sign-out all exercise the real client code.
- The dashboard header shows a gold **Demo mode · mock data** chip while the mock is active.
- Nothing is persisted server-side; "accounts" do not exist (any valid email works).

To talk to a real backend, set `VITE_AUTH_MOCK=false` (and `VITE_API_URL`) in `.env`, then restart `npm run dev`.

## Backend endpoints the frontend expects

All under `/api/v1`, JSON bodies. Full contract: [`docs/api/auth-contract.md`](../docs/api/auth-contract.md).

| Method | Path             | Auth   | Used by                                                 |
|--------|------------------|--------|---------------------------------------------------------|
| POST   | `/auth/register` | none   | Sign-up form                                            |
| POST   | `/auth/login`    | none   | Sign-in form                                            |
| POST   | `/auth/refresh`  | none   | Session restore on load + silent retry after a 401      |
| GET    | `/dashboard`     | Bearer | Dashboard header / welcome (`user.email`, `user.full_name`) |
| GET    | `/health`        | none   | "Backend connected/offline" chip (only when mock is off)|

## Environment variables

| Variable         | Default                 | Purpose                                                                        |
|------------------|-------------------------|--------------------------------------------------------------------------------|
| `VITE_API_URL`   | `http://localhost:8000` | FastAPI base URL (no trailing slash). Used when the mock is off.               |
| `VITE_AUTH_MOCK` | on in dev (`!== 'false'`) | `false` disables the dev-only mock. Always off in production builds.         |

No secrets belong in `VITE_*` variables: they are bundled into the browser build.

## Layout

```
src/
  three/            3D world: SceneStage (Canvas) > SceneRoot (frame loop) > Bubble, Droplets, Coins, Rupee,
                    Platform, MarketChart, Analysis, DataParticles; story.ts = scroll -> scene mapping
  components/landing  SceneBackdrop (lazy 3D + video fallback), StoryOverlay (scroll copy), AuthStage
  features/auth     AuthContext/Provider, AuthPanel (glass login/signup card)
  features/customer-dashboard  overview, nav items, placeholders
  layouts/CustomerDashboardLayout
  services/         api.ts (fetch + JWT + single-flight refresh + MOCK_AUTH switch), auth.ts, mockBackend.ts (dev only)
  routes/ProtectedRoute.tsx
  pages/            Landing, Login, Signup, ForgotPassword
public/media/       intro video + poster (made once from the reference GIF; used only if WebGL is unavailable)
```

## How the landing experience works

- `Landing` is a 500svh track with one sticky 100svh stage. `useScrollProgress` (framer-motion `useScroll` + spring)
  yields a MotionValue 0..1: **scroll is the timeline**, with no per-scroll React renders.
- `three/story.ts` is the single pure mapping progress -> bubble radius/tension, coin count, chart reveal,
  analysis layer, organisation, camera, lights. Tune the story here.
- The bubble is a transmissive `MeshPhysicalMaterial` (ior 1.33, iridescence) with shader wobble/ripples.
  Past ~93% scroll the burst **latches** and plays in real time (`runtime.ts`: BURST_DURATION, REVEAL_AT):
  a noisy hole spreads over the film, droplets scatter and fall. Scrolling back below ~89% re-forms it.
- When the clock passes `REVEAL_AT`, `onReveal(true)` fades in `AuthPanel` and the world slides aside.
- Hover is secondary: pointer parallax on camera/panes, ₹ tilt + sheen, coin lift, chart point glow, CTA depth, card tilt.
- Tiers: mobile = fewer particles/coins, no reflector, no hover, half-res transmission; `prefers-reduced-motion`
  = one settled static render + login (no scrubbed story). If WebGL fails, the looping video fallback is shown and the login card is revealed at the same scroll point (~93%).

## Assets

`scripts/convert-intro-gif.sh <gif>` converts the reference GIF to `stockiq-intro.{mp4,webm}` + poster once.
The app never converts at runtime.
