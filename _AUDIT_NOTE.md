# Audit Notes — AIEnvironmentMonitor

Audit source: `_AUDIT/reports/batch_03.md` § 15 (template-clone, audit reported 0 AI endpoints).

## Original audit recommendations

### Missing AI counterparts
- `/carbon-reduce-recommend`, `/energy-optimize`, `/water-conserve`,
  `/recycling-sort`, `/sustainability-goals`.

### Missing non-AI features
- Team management.
- Impact visualization.
- Leaderboards.
- Smart-meter integration.

### Custom feature suggestions
- Real-time carbon tracker (smart-meter streaming).
- Carbon offset marketplace.
- Supply-chain (Scope 3) emissions.
- Workplace sustainability gamification.
- Simplified Scope 1/2/3 reporting for SMBs.
- Behavioral nudges.
- Utility (Opower-style) integration.

## Current state observed

Audit's "0 AI endpoints" outdated — `routes/aiNew.ts` already provides
`/trend-forecast`, `/weekly-digest`, `/community-benchmark`, plus AI history
endpoints. Routes for carbon, energy, water, recycling, weather are present.

## Implementations applied this pass

None this pass — TypeScript build pipeline was not exercised here, so adding
new TS handlers risks breaking the type checker without a tsc run, which is
out of "no install" scope.

## Prioritized backlog

1. **MECHANICAL (TS)** — Add `/api/ai/carbon-reduce-recommend` in `aiNew.ts`
   reading recent carbon entries and returning ranked reductions.
2. **MECHANICAL (TS)** — Add `/api/ai/recycling-sort` accepting an item
   description and returning bin / municipality guidance.
3. **NEEDS-CREDS** — Smart-meter / utility integrations (Green Button) need
   per-utility credentials.
4. **NEEDS-PRODUCT-DECISION** — Carbon offset marketplace needs vendor
   listings, settlement, and KYC.
5. **TOO-RISKY** — Public leaderboards may expose individual usage
   patterns; needs privacy review.

## Apply pass 3 (frontend)

CREATED-FE. The existing `AIResults.tsx` was a read-only history viewer; none
of `aiNew.ts`'s three POST endpoints had a UI entry-point. Added:

- `client/src/pages/AIInsights.tsx` — tool switcher for `trend-forecast`,
  `weekly-digest`, and `community-benchmark`. Sends JWT via
  `localStorage.getItem('token')`, handles 503 with "AI not configured"
  message, displays JSON result and links to `/ai-results` for history.
- `client/src/App.tsx` — registered `/ai-insights` route.
- `client/src/components/Sidebar.tsx` — added "AI Insights" nav item next to
  the existing "AI Results".

`tsc --noEmit -p .` passes in `client/`. No new dependencies.

## Apply pass 4 (mechanical backlog)

Added the two MECHANICAL backlog items from "Prioritized backlog" §1 and §2:

- `server/routes/aiNew.ts`: appended
  `POST /api/ai/carbon-reduce-recommend` (reads recent `carbon_footprints`
  rows for the user, asks LLM for ranked CO2e-reduction strategies) and
  `POST /api/ai/recycling-sort` (accepts `{ item_description, municipality? }`
  and returns bin / disposal guidance). Both reuse the existing `analyzeWithAI`
  helper, `authenticateToken`, `aiRateLimiter`, and persist via
  `persistAIResult` into `ai_results`. Both **explicitly return 503** when
  `OPENROUTER_API_KEY` is unset/placeholder (the older endpoints in this file
  silently degrade — the two new ones surface 503 cleanly for the FE).
- `client/src/pages/AIInsights.tsx`: added two new tool tabs
  (`carbon-reduce-recommend`, `recycling-sort`) with form fields (lookback
  days; item description + optional municipality). JWT bearer attached from
  `localStorage.getItem('token')`. Existing 503 branch in `run()` now also
  surfaces these endpoints' "AI not configured" errors.

Validation:
- `npx tsc --noEmit -p .` passes in repo root (server) and `client/`.
- Smoke test: started server with `OPENROUTER_API_KEY=""`, registered/logged
  in, `POST /api/ai/carbon-reduce-recommend` and `POST /api/ai/recycling-sort`
  both returned `HTTP 503` with body
  `{"error":"AI not configured: OPENROUTER_API_KEY missing on the server."}`.
  No `npm install`, no new deps.

Remaining backlog items 3-5 (smart-meter creds, carbon-offset marketplace,
public leaderboards) intentionally skipped per pass-4 scope (creds /
product-decision / privacy-review).

## Apply pass 5 (all backlog)

IMPLEMENTED — closed all 3 remaining backlog items (NEEDS-CREDS smart-meter,
NEEDS-PRODUCT-DECISION carbon-offset marketplace, TOO-RISKY public
leaderboards) via new `server/routes/aiBacklog.ts` (10 endpoints) +
`client/src/pages/AIBacklog.tsx` (3-tab UI).

New tables (idempotent IF NOT EXISTS): `smart_meter_readings`,
`offset_intents`, `leaderboard_optins`.

ENV vars (gated behind 503 + `missing:` field):
- `GREEN_BUTTON_API_KEY`, `GREEN_BUTTON_BASE_URL` — gate `/smart-meter/sync`
- `OPENROUTER_API_KEY` — gate `/offset-marketplace/match` (AI advisor)

Endpoints (10):
- `GET /api/ai/smart-meter/status` — reports configured + missing list
- `POST /api/ai/smart-meter/sync` — 503 missing GREEN_BUTTON_*
- `POST /api/ai/smart-meter/ingest` — manual JSON readings push (no creds)
- `GET /api/ai/smart-meter/readings` — list user's readings
- `GET /api/ai/offset-marketplace/vendors` — curated catalog (Verra,
  Gold Standard, CAR, Puro.earth, CDR.fyi)
- `POST /api/ai/offset-marketplace/match` — AI ranks vendors for tonnes_co2e
- `POST /api/ai/offset-marketplace/intent` — record intent ONLY; payment/KYC
  EXPLICITLY out-of-scope.
- `GET  /api/ai/offset-marketplace/intents` — list user intents
- `POST /api/ai/leaderboard/opt-in` (+ DELETE) — opt-in/out;
  anonymized handle `user-XXXXXX` from sha256 — never exposes email/name.
- `GET /api/ai/leaderboard/:metric` — `lowest-carbon` or `most-recycling`,
  only opted-in users; tolerates missing source tables (returns empty rows).

Frontend: `client/src/pages/AIBacklog.tsx` registered as `/ai-backlog` in
`App.tsx`. Three tabs: smart-meter (ingest + status + sync 503), offsets
(vendors + AI match 503 + intent), leaderboard (opt-in/view).

Validation: `npx tsc --noEmit -p .` PASS for both server and client.
Smoke test PASS — alt port 3502, `OPENROUTER_API_KEY=""` `GREEN_BUTTON_API_KEY=""`.
- `/smart-meter/status` → `{configured:false, missing:["GREEN_BUTTON_API_KEY","GREEN_BUTTON_BASE_URL"]}`
- `/smart-meter/sync` → `HTTP 503 {"error":"Smart-meter integration not configured","missing":"GREEN_BUTTON_API_KEY"}`
- `/smart-meter/ingest` → `{inserted:1, ids:[1]}` (works without creds)
- `/offset-marketplace/vendors` → 5 vendor catalog
- `/offset-marketplace/match` → `HTTP 503 {"error":"AI not configured","missing":"OPENROUTER_API_KEY"}`
- `/leaderboard/opt-in` → `{opted_in:true, anon_handle:"user-XXXXXX"}`
- `/leaderboard/lowest-carbon` → `{metric, entries:[], note}`. Server killed after.

No `npm install`, no new dependencies.
