# Progress

## Completed phases
- Phase 1 — audit approved.
- Phase 2A — engine specification approved; deadline corrected to 18 October 2026 IST (exact time unknown).
- Phase 2B — deterministic pure TypeScript engine implemented; build, lint, and engine tests run.
- Phase 2C — isolated offline Arena UI, scenario flow, mentor, result/autopsy, and replay experience implemented; engine scenario tests, build, and lint run.
- Phase 2D — same-tab session persistence, refresh restoration, explicit-exit cleanup, and logout cleanup implemented; persistence/engine tests, build, and lint run.

## Decisions
- No exchange-specific defaults; unresolved configuration is rejected as `TBD — source verification required`.
- Synthetic inputs and risk settings require explicit illustrative labels.
- Node built-in test runner with TypeScript type stripping; no test dependencies added.
- One open position per run; margin calls liquidate on the next eligible tick.
- Arena UI uses fixed synthetic paths labelled illustrative; tick-by-tick stepping prevents hidden future prices from being shown.
- Capital score is only final equity relative to the 1,000 PTS start, capped at 100; it is disclosed as neither a skill rating nor personal assessment.

## Open issues
- India contract/source/lot/expiry details, EUR/USD unit conversion, sourced rates and volatility, real market/provider terms, and verified leverage/margin/cost values remain TBD.
- Arena persistence stays in a versioned sessionStorage adapter outside the pure engine; invalid or unavailable storage falls back without inventing a restored run.
- Exact competition deadline time is unknown.
- Browser walkthrough could not be completed because the local-origin approval gate rejected browser access; no workaround was attempted.

## Next phase
- Await approval before further phases or external integrations.
