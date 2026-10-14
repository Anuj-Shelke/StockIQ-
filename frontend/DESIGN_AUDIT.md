# StockIQ Frontend Design Audit

## 1. Executive Summary & Stack Detection
- **Framework & Bundler:** React 19.2.8 (`react`, `react-dom`), Vite 8.3.0, TypeScript 6.0.2.
- **Styling Architecture:** Tailwind CSS v4 (`@tailwindcss/vite` 4.3.3) imported via `@import "tailwindcss";` in `src/index.css`.
- **Typography:** `@fontsource-variable/inter` (UI sans) and `@fontsource-variable/fraunces` (editorial serif display).
- **Chart Library:** `recharts` 3.10.1 (SVG-based charting).
- **3D & Animation Stack:** Three.js 0.180.0, `@react-three/fiber` 9.3.0, `@react-three/drei` 10.7.0, `framer-motion` 12.23.0.
- **Routing & State:** `react-router-dom` 7.9.0 with client AuthContext, ThemeContext, and route-level lazy loading.
- **Icons:** `lucide-react` 1.55.0.

---

## 2. Current Theme Implementation & Toggle Mechanism
- **Mechanism:** `ThemeContext.tsx` toggles between `'dark'` and `'light'` state, persisting in `localStorage` (`stockiq_theme`). It sets classes `.light` or `.dark` on `document.documentElement`.
- **Deficiencies Identified:**
  1. No initial inline `<script>` in `index.html` to set the theme before first paint, risking flash-of-unstyled-content (FOUC).
  2. The custom properties were partially hard-coded in `@theme` as static hex colors (`--color-ink-950: #03060d; --color-gold-300: #f1d98a;`) instead of semantic CSS variables changing under `[data-theme="dark"]` and `[data-theme="light"]`.
  3. Light mode was implemented as an aggressive override with `!important` classes (`html.light .bg-ink-950 { background-color: #f8fafc !important; }`), creating high specificity conflicts and inverted contrasts rather than a dedicated warm ivory editorial palette.

---

## 3. Landing Page & 3D Architecture
- **Stage Container:** `src/pages/Landing.tsx` uses a `600svh` scroll track holding a sticky `100svh` stage.
- **Scroll Choreography:** `useScrollProgress()` hooks Framer Motion's `useScroll` with a smooth spring (`stiffness: 85, damping: 26`).
- **Hero Object:** `src/three/Rupee.tsx` holds the 3D Black Financial Card (`ExtrudeGeometry` with black ceramic `MeshPhysicalMaterial`, thin gold bevel perimeter, and embossed ₹ tube glyph).
- **Scene Choreography:** `src/three/SceneRoot.tsx`, `story.ts`, and `runtime.ts` choreograph the 5 stages:
  - 01 Money (Hero Card)
  - 02 Growth (Coin ring & expansion)
  - 03 Data (Market charts & particles)
  - 04 Analysis (Geometry lines & connections)
  - 05 Insight (Bubble tension & reveal)
- **Overlay:** `src/components/landing/StoryOverlay.tsx` maps MotionValues to opacity and blur.
- **Deficiencies Identified:** Text overlays lacked calibrated contrast tokens; the transition to `AuthPanel.tsx` felt detached rather than an organic emergence from the black card aesthetic.

---

## 4. Dashboard & Layout Architecture
- **Shell:** `src/layouts/CustomerDashboardLayout/CustomerDashboardLayout.tsx` provides a 16rem sidebar + top header with backend status, theme toggle, and email.
- **Routes Covered:**
  - `/dashboard` (Overview)
  - `/dashboard/next-day-open` (Next-Day Open Prediction)
  - `/dashboard/recommendations` (AI Recommendations)
  - `/dashboard/portfolio` (Portfolio Management)
  - `/dashboard/risk-check` (Risk Reality Check)
  - `/dashboard/compare` (Cross-Asset Comparison)
  - `/dashboard/explainability` (XAI Feature Attribution)
  - `/dashboard/education` (Financial Education Hub)
  - `/dashboard/history` (Analysis Snapshots)
  - `/dashboard/sebi-rules` (SEBI Compliance Chatbot)
  - `/dashboard/review-request` (Dispute Audit Request Center)
  - `/dashboard/admin` (Admin Governance Portal)
- **Deficiencies Identified:**
  - The dashboard relied on a generic 4-column metric grid (`Total Value | Risk Score | Gain/Loss | Activity`) before showing content.
  - The signature StockIQ narrative composition (**Dominant Portfolio Value → Risk Reality Check: What could happen to MY money? → Scenario & Rupee Impact → Supporting Analytics**) was broken into disjointed cards.

---

## 5. Hard-Coded Colors Audit
- Scattered Tailwind utilities across components:
  - `bg-ink-950`, `bg-ink-900`, `bg-white/5`, `bg-white/10`, `border-white/10`, `border-white/20`.
  - `text-slate-100`, `text-slate-200`, `text-slate-300`, `text-slate-400`, `text-slate-500`.
  - `text-gold-300`, `text-gold-400`, `bg-gold-500`, `border-gold-500/30`.
  - `text-emerald-400`, `text-rose-400`, `bg-rose-500/10`.
  - Direct hex colors in Recharts SVGs (`#f59e0b`, `#3b82f6`, `#10b981`, `#f43f5e`, `#64748b`, `#ffffff15`).

---

## 6. Duplicated & Inconsistent Components
- **Buttons:** Hand-crafted classes in every component (`btn-gold` in some places, custom `rounded-lg border px-3 py-1.5` in others).
- **Cards:** Inconsistent radius (`rounded-xl` vs `rounded-2xl` vs `rounded-3xl`) and inconsistent border styling.
- **Inputs & Badges:** Different padding, typography sizes, and border treatments across modals and forms.

---

## 7. Chart Palette Audit
- `AllocationChart.tsx`: Uses an 8-color rainbow palette (`amber, blue, emerald, purple, pink, cyan, orange, teal`).
- `DrawdownChart.tsx`: Hardcoded amber/rose gradients.
- `ComparisonChart.tsx`: Fixed hex lines.
- `ShapWaterfallChart.tsx`: Fixed green/rose cells.
- **Remedy:** Centralize all chart colors into a theme-aware hook (`useThemeTokens`) reading from CSS custom properties with gold, analytical blue, emerald anchor, and disciplined crimson risk indicators.

---

## 8. Redesign Execution Plan
1. **Design Tokens (`DESIGN_SYSTEM.md` & `src/styles/tokens.css` / `src/index.css`):**
   - Centralize all colors, typography, elevations, radiuses, and chart palettes under `[data-theme="dark"]` and `[data-theme="light"]`.
2. **Theme System & FOUC Prevention (`index.html`, `ThemeContext.tsx`, `ThemeToggle.tsx`):**
   - Add inline theme script in `index.html`.
   - Update `ThemeContext.tsx` with `data-theme` attribute, `stockiq-theme` key, and smooth View Transition / CSS crossfade.
   - Craft a luxury theme toggle control with Sun/Moon indicator and accessible cues.
3. **Core Reusable Components (`src/components/ui/`):**
   - `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`, `Tabs.tsx`, `Modal.tsx`.
   - Implement the **Black Financial Card** surface, **Gold Intelligence Line**, and **Risk Lens**.
4. **Signature Composition on Dashboard (`DashboardOverview.tsx`):**
   - Dominant ₹ metric with quiet label and growth figure.
   - Integrated **Risk Reality Check** hero module ("What could happen to MY money?").
   - 3-tier Explainable AI badge layer (Verified Data → AI Interpretation → Why This Matters).
5. **Screen-by-Screen Visual Refinement:**
   - Landing & Auth (`Landing.tsx`, `StoryOverlay.tsx`, `AuthPanel.tsx`).
   - App Shell (`CustomerDashboardLayout.tsx`).
   - Risk Reality Check, Portfolio, Comparison, Education, Explainability, Admin.
6. **Chart Palette Unification:**
   - `useThemeTokens.ts` feeding Recharts in all 4 chart components.
7. **Verification & Testing:**
   - Full build validation (`tsc -b && vite build`).
   - Contrast check, responsiveness check, and 10-second judge test.
