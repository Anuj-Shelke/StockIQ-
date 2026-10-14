# StockIQ Design System: Specification & Guidelines

## 1. Design Philosophy
StockIQ is an AI-powered financial intelligence and portfolio risk engine for Indian investors. It conveys:
- **Intelligent Authority:** Calm, analytical, and mathematically rigorous.
- **Visual Restraint:** No unnecessary gradients, no cartoonish glows, no excessive glassmorphism.
- **Dual Authentic Themes:**
  - **Dark = Cinematic Intelligence:** Midnight navy environment (`#070B14`), matte black financial surfaces, thin gold hairline accents, and analytical blue insights.
  - **Light = Editorial Financial Research:** Warm ivory atmosphere (`#F7F3EA`), pearl surfaces (`#FFFFFF`), champagne gold accents, and deep navy typography reminiscent of a prestige financial publication.

---

## 2. Color Tokens

| Token | CSS Variable | Dark Theme (Midnight) | Light Theme (Warm Ivory) | Semantic Role |
|---|---|---|---|---|
| **Background** | `--bg-canvas` | `#070B14` | `#F7F3EA` | App canvas & scene backdrop |
| **Surface** | `--bg-surface` | `#0D1424` | `#FCFBF8` | Primary card & section surfaces |
| **Surface Elevated** | `--bg-elevated` | `#131C30` | `#FFFFFF` | Modals, drawers, and active cards |
| **Surface Hover** | `--bg-hover` | `#18233B` | `#F1ECE0` | Interactive card hover states |
| **Border Subtle** | `--border-subtle` | `#151E33` | `#EEE8DA` | Dividers and gentle enclosures |
| **Border Default** | `--border-default` | `#1F2A44` | `#E4DDCC` | Standard structural borders |
| **Border Focus** | `--border-focus` | `#D4A84B` | `#A87B1F` | Keyboard focus & active states |
| **Text Primary** | `--text-primary` | `#E8ECF4` | `#101828` | Headlines and dominant figures |
| **Text Secondary** | `--text-secondary` | `#A8B2C7` | `#3B4660` | Body copy and labels |
| **Text Muted** | `--text-muted` | `#6F7A93` | `#6B7488` | Metadata and secondary metrics |
| **Gold Primary** | `--gold-primary` | `#D4A84B` | `#A87B1F` | Brand accents, key actions, ₹ mark |
| **Gold Soft** | `--gold-soft` | `rgba(212, 168, 75, 0.14)` | `rgba(168, 123, 31, 0.12)` | Subtle category badges & pills |
| **Blue Intelligence** | `--blue-primary` | `#5B8DEF` | `#2F5FC4` | Verified data, links, ML factors |
| **Success / Positive**| `--color-success` | `#34B58A` | `#0F8A63` | Positive returns & resilient assets |
| **Warning / Caution** | `--color-warning` | `#E3A23B` | `#B5730F` | Moderate exposure & pending states |
| **Risk / Danger**     | `--color-danger`  | `#E5584F` | `#C23B33` | Historical drawdown & high exposure|

---

## 3. StockIQ Visual Signatures

### 1. The Black Financial Card
- Surface: Matte ceramic/metal tone (`#060A13` in dark, `#121826` in light).
- Perimeter: 1px subtle gold hairline (`border: 1px solid rgba(212, 168, 75, 0.3)`).
- Glyph: Embossed ₹ motif with clean typography.
- Used in landing hero, portfolio highlight, and key insight modules.

### 2. Gold Intelligence Line
- A razor-thin hairline (`1px`, `rgba(212, 168, 75, 0.4)`) used strictly to connect dependent figures (e.g., Portfolio Value → Estimated Stress Drawdown). Never used as arbitrary decoration.

### 3. The Risk Lens
- Avoids simple traffic-light green/red indicators.
- Four-level calibrated exposure vocabulary:
  1. **Low Exposure** (`#34B58A`)
  2. **Moderate Exposure** (`#5B8DEF`)
  3. **Elevated Exposure** (`#E3A23B`)
  4. **High Vulnerability** (`#E5584F`)
- Paired with explicit textual tags and numerical drawdowns.

### 4. 3-Tier AI Explanation Layer
Every AI insight follows an auditable 3-tier presentation:
- **Tier 1 (Verified Data):** Navy/Blue tag with computed figures.
- **Tier 2 (AI Interpretation):** Plain-language synthesis.
- **Tier 3 (Why This Matters):** The risk connection tying model parameters to investor impact.

---

## 4. Typography Scale

- **Display:** `font-display text-4xl sm:text-5xl font-semibold tracking-tight` (Fraunces serif)
- **H1:** `font-display text-2xl sm:text-3xl font-semibold tracking-tight`
- **H2:** `text-xl font-semibold tracking-tight`
- **H3:** `text-base font-semibold`
- **Metric (Hero):** `text-3xl sm:text-4xl font-bold tracking-tight tabular-nums`
- **Metric Label:** `text-[11px] font-semibold uppercase tracking-[0.22em] text-muted`
- **Body:** `text-sm leading-relaxed text-secondary`
- **Caption / Metadata:** `text-xs text-muted`

---

## 5. Spacing, Elevation & Radius
- **Spacing Unit:** 4px grid (4, 8, 12, 16, 24, 32, 48, 64).
- **Border Radius:**
  - Small: `6px` (`rounded-md`) for buttons, inputs, tooltips.
  - Medium: `10px` (`rounded-lg`) for inner widgets and sub-cards.
  - Large: `16px` (`rounded-2xl`) for outer container cards.
  - Pill: `9999px` (`rounded-full`) strictly for badges, status chips, and segmented pills.
- **Elevation Shadows:**
  - Level 1: `0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)`
  - Level 2: `0 4px 16px -2px rgba(0, 0, 0, 0.35)`
  - Level 3 (Modals): `0 20px 48px -12px rgba(0, 0, 0, 0.65)`

---

## 6. Chart Palette Tokens
All Recharts charts share these unified tokens:
- **Primary Line / Main Asset:** `--gold-primary` (`#D4A84B` / `#A87B1F`)
- **Secondary Line / Benchmark:** `--blue-primary` (`#5B8DEF` / `#2F5FC4`)
- **Resilient / Fixed Income (FD):** `--color-success` (`#34B58A` / `#0F8A63`)
- **Drawdown / Loss Area:** `--color-danger` with 15% opacity gradient
- **Grid Lines:** `var(--border-subtle)` with `strokeDasharray="3 3"`
- **Axis Text:** `var(--text-muted)`
- **Tooltip Surface:** `var(--bg-elevated)` with `border: 1px solid var(--border-default)`

---

## 7. Card Hierarchy Variants
1. **Primary Insight Card (`card-hero`):** Contains the primary ₹ figure, gold perimeter hairline, and immediate risk relationship.
2. **Data & Chart Card (`card-data`):** Clean border, minimal internal noise, high chart legibility.
3. **Risk Reality Lens Card (`card-risk`):** Features the exposure gauge, stress drawdown %, and value-at-risk.
4. **Interactive Card (`card-interactive`):** Subtle hover elevation (`translate-y-[-2px]`), border brightening.
5. **Educational & Explanatory Card (`card-edu`):** Calmer blue-tinted surface, source attribution pills.
