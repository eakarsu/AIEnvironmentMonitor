# Completeness Review: AIEnvironmentMonitor

- **Review date:** 2026-07-20
- **Assessment basis:** Initial static source/configuration review plus follow-up local typecheck, tests, production build, disposable PostgreSQL migration/seed, launcher, login, and authenticated persisted-session verification. No external sensor/provider integration was exercised.

## Classification

**Prototype-demo**

## Verdict

The repository presents a broad environmental monitoring surface (85 source files and 31 route modules), but static evidence is characteristic of a generated prototype. Pages and endpoints demonstrate concepts; they do not establish a verified execution path to register sites/devices, ingest calibrated observations, quality-control them, detect threshold events, and manage investigations/reports.

## Why it is not complete

- 1 file is explicitly named as gap/gap-feature implementations; route/page count therefore overstates completed product capability.
- The route/page inventory includes `aibacklog`, `aiinsights`, `airesults`, `admin panel`; these surfaces show breadth but not durable execution against authoritative systems.
- 16 files reference model-provider or chat-completion behavior; generic LLM calls are not a substitute for deterministic domain execution, grounding, or evaluation.
- 21 files contain mock, sample, placeholder, or random-data signals, leaving important outcomes disconnected from authoritative systems.
- No recognizable application test files were found in the inspected tree.
- No environment example/template was found, so required configuration and secret boundaries are undocumented.

## Needed features

- 1. Implement a workflow to register sites/devices, ingest calibrated observations, quality-control them, detect threshold events, and manage investigations/reports.
- 2. Connect sensor gateways, labs, GIS/weather, regulatory systems, maintenance, and alerting; replace seed/demo records with durable synchronized data and explicit failure handling.
- 3. Test units, calibration, missing/outlier data, alert precision, spatial/temporal aggregation, and reporting.
- 4. Authenticate devices, preserve chain of custody and correction history, version limits, and require analyst review.
- 5. Add contract, integration, authorization, migration, and end-to-end tests in CI, plus a documented non-destructive deployment/run path.

## Risks or launch blockers

- Credential/secret fallback or demo-password patterns occur in 3 files and must be removed or made development-only.
- The root launcher can terminate unrelated processes occupying configured ports.
- The root launcher seeds, creates, migrates, or otherwise mutates database state during startup.
- The root launcher installs dependencies at run time, reducing reproducibility and expanding supply-chain risk.
- Ungrounded or malformed model output can become a domain action unless schemas, evidence, evaluations, and approval gates are added.

## Evidence inspected

- `client/package.json` — declared scripts, runtime dependencies, and application boundaries.
- `package.json` — declared scripts, runtime dependencies, and application boundaries.
- `client/src/i18n/index.ts` — service composition, middleware, and registered routes.
- `server/index.ts` — service composition, middleware, and registered routes.
- `server/routes/admin.ts` — implemented API surface and domain/AI request handling.
- `server/routes/aiBacklog.ts` — implemented API surface and domain/AI request handling.

## Recommended next action

Treat this as a prototype: use aibacklog and aiinsights to select one narrow environmental monitoring outcome, quarantine generated gap routes, and implement that outcome end to end with real data, deterministic rules, and tests before adding features.

## Implementation progress

- **Needed feature 1 — locally implemented:** `server/routes/governedInvestigations.ts`, `server/domain/investigationPolicy.js`, and `server/database/migrations/001_governed_investigations.sql` now provide tenant-scoped site/device registration, calibrated idempotent observation ingestion, QC transitions, threshold-versioned investigations, analyst review, report-linked closure, and history.
- **Needed feature 2 — local boundary implemented; external connection blocked:** device/site/source IDs, credential fingerprints, timestamps, calibration provenance, and durable observation/investigation records establish gateway/lab/GIS/weather/regulatory/maintenance/alert adapter contracts. Those real systems and credentials were unavailable and are not claimed.
- **Needed features 3–4 — locally implemented:** observations retain units and raw values, flag rather than erase outliers, reject non-finite values, bind a device to its registered site, require an active matching device fingerprint and unexpired calibration, restrict registration/QC/closure to analyst/admin roles, and retain correction/custody history. Calibrated hardware, lab procedures, spatial/statistical validation, regulatory acceptance, and alert-precision studies remain external blockers.
- **Needed feature 5 / launch risks — locally implemented:** generated gap routes are no longer mounted; production DB secrets fail closed; production demo seed is disabled; `.env.example`, CI, documentation, migrations, dependency-free tests, explicit bootstrap/migrate/guarded seed, and a non-destructive start path were added.
- **Validation performed:** 3 policy tests, TypeScript typecheck, production client build, and changed shell syntax checks passed. The disposable runtime harness verified `start.sh`, database-backed login, and an authenticated persisted profile request on PostgreSQL `55561` and API `5942` (UI allocation `5943`). The production database guard rejected missing credentials as expected. The build retained non-fatal pre-existing lint warnings; no sensor or external provider was exercised.
