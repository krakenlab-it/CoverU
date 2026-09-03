# Release gates, environments, and incident response

This document describes how CoverÜ moves safely from local development through PR preview to production. It is intentionally independent of product UI redesign work.

## Gate summary

| Stage | Required checks | Blocks promotion when |
| --- | --- | --- |
| Local | `npm run ci` | Any lint, type, unit, migration, build, or E2E failure |
| Pull request | GitHub Actions `CI` workflow | Same as local, plus ephemeral Postgres migration apply |
| PR preview | `Preview verification` workflow (when URL discoverable) | Preview smoke failures against discovered Vercel URL |
| Production | Manual promotion in Vercel + Supabase migration apply | Failing production readiness or open incident |

## Local commands

```bash
npm ci
npm run ci                 # full local gate (no external systems)
npm run test:unit          # Vitest unit/integration
npm run validate:migrations
npm run test:migrations:ephemeral   # requires local DATABASE_URL (never production)
npm run test:e2e           # Playwright smoke (starts local server)
npm run test:a11y          # axe accessibility checks
```

Local CI does **not** require Vercel, Supabase production, or OpenAI secrets. Demo mode is the default (`COVERAGE_QA_PROVIDER=demo`).

## CI workflow design

- **Node version**: pinned in `.nvmrc` (`22.12.0`) and used via `node-version-file`.
- **Dependency install**: `npm ci` with npm cache keyed on `package-lock.json`.
- **Duplicate run avoidance**: `push` triggers only on `main`; feature branches run via `pull_request`. Concurrency cancels superseded runs.
- **Failure artifacts**: Playwright HTML report and test results uploaded on E2E failure.
- **No production mutation**: migration ephemeral job uses GitHub Actions Postgres service only; script refuses `*.supabase.co` URLs.

## Preview verification

The `Preview verification` workflow:

1. Skips safely for fork PRs (no false green — job reports skipped).
2. Discovers a Vercel preview URL from GitHub Deployments or Vercel bot comments.
3. If no URL is found yet, exits neutrally (does not fail the PR).
4. When a URL is found, runs a minimal Playwright smoke subset against `PLAYWRIGHT_BASE_URL`.

No new repository secrets are required for local CI or fork PRs.

## Supabase migrations

### Order (apply in filename sort order)

1. `20250101000000_initial_schema.sql`
2. `20250101000001_seed_demo_data.sql`
3. `20250102000000_phase1_schema.sql`
4. `20250102000001_phase1_seed_demo.sql`

### Static validation (`npm run validate:migrations`)

- Timestamp ordering
- Valid UUID literals in fixtures
- Seed demo markers (`is_demo` / `[DEMO]`)
- Seed idempotency (`ON CONFLICT`)
- RLS presence on schema migrations
- Duplicate table/type/policy hazards
- Phase 1 required objects
- TypeScript `.from("table")` drift vs migrations

### Ephemeral apply (`npm run test:migrations:ephemeral`)

Applies all migrations to a disposable Postgres database and re-applies seed files to verify idempotency when compatible with the final schema. When `tariff_schema_v1_3` is present, seed re-apply is skipped because that migration backfills demo regions and tightens CHECK constraints — original `metropolitana` seed values are superseded. **Never** point `DATABASE_URL` at production or hosted Supabase.

## Data pipeline scaffolding (Excel loader)

Scaffolding lives under `src/lib/data-pipeline/` for the forthcoming CoverU Excel loader:

- Checksum manifest schema (`manifest.ts`)
- Rejected-row quarantine contract (`quarantine.ts`)
- Idempotent dry-run preview counts (`dry-run.ts`)
- Explicit promotion gate (`promotion-gate.ts`)

These modules validate contracts only — they do not implement Mike's cleaning logic or ingest real spreadsheets.

## Environment name matrix (names only)

| Environment | Vercel project env | Supabase project | Notes |
| --- | --- | --- | --- |
| `local` | n/a | local / none | Demo mode without Supabase |
| `preview` | Preview | staging (optional) | PR deployments |
| `production` | Production | production | Customer-facing |

### Variable names (no values)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `API_KEY_PEPPER`
- `API_RATE_LIMIT`
- `API_RATE_WINDOW_MS`
- `COVERAGE_QA_PROVIDER`
- `OPENAI_API_KEY`
- `COVERAGE_QA_MODEL`

## Ownership

| System | Owner | Responsibility |
| --- | --- | --- |
| Vercel | Engineering | Deployments, env vars, rollbacks |
| Supabase | Engineering | Migrations, RLS, backups |
| GitHub Actions | Engineering | CI/CD workflows |
| Dependabot | Engineering | Monthly grouped npm updates (non-major) |

## Rollback and restore

### Application (Vercel)

1. Open Vercel → Project → Deployments.
2. Select last known-good production deployment.
3. Promote to Production (instant rollback).
4. Verify `/api/health` and `/api/ready`.

### Database (Supabase)

1. **Do not** run ad-hoc destructive SQL in production.
2. Restore from Supabase point-in-time backup or snapshot per Supabase dashboard procedure.
3. Re-apply only forward migrations on a restored clone before promoting.
4. Document incident in team channel with migration IDs affected.

## Incident checklist

1. Confirm scope (preview vs production).
2. Check `/api/health` and `/api/ready` on affected environment.
3. Review recent deployments and migrations (last 24h).
4. Capture request IDs from `x-request-id` response headers (no PII in logs).
5. Roll back Vercel deployment if application regression; use DB restore only for schema/data incidents.
6. Open follow-up issue with root cause and test gap.
7. Verify CI green on fix branch before re-promotion.

## Operational endpoints

- `GET /api/health` — liveness probe
- `GET /api/ready` — readiness with config checks (demo vs Supabase, coverage provider)

Structured JSON logs redact secrets and email-like values (`src/lib/logging/logger.ts`).
