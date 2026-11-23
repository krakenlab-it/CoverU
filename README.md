# CoverÜ

Comparador de seguros de salud en Chile — Next.js App Router + Supabase.

## Features

- Spanish landing with CoverÜ wordmark, Poppins font, and brand red `#DF0926`
- Responsive header and footer
- `/comparar` — age/gender/region gate with demo plan cards showing "tú pagas $X", honest limits, and expandable details
- Static pages: `/nosotros`, `/agentes`, `/contacto`, `/faqs`
- `/api/leads` — lead capture API
- Supabase migrations for `insurers`, `plans`, `tariffs`, and `leads`
- **Phase 1 (stacked PR):** organizations, B2B API keys, plan versions, coverage catalog, quotes, usage logs, `/api/v1` REST API, grounded coverage Q&A, `/developers` docs, auth panel at `/app`
- **Phase 2 (stacked PR #3):** logged-in marketplace at `/app/marketplace` — search/filter/sort, plan cards, 2–4 plan compare workspace, policy detail viewer, embedded grounded coverage assistant
- Demo data unmistakably labeled as `[DEMO]` / "DEMO — datos de ejemplo"

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Logged-in marketplace: [http://localhost:3000/app/marketplace](http://localhost:3000/app/marketplace) (demo mode without Supabase).

Without Supabase env vars, the app runs in demo mode using in-memory example data.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | For persistence | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For persistence | Supabase anon (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | For lead API | Server-only service role key |
| `API_KEY_PEPPER` | For B2B API | Server-only pepper for API key hashing |
| `COVERAGE_QA_PROVIDER` | Optional | `demo` (default) or `openai` |
| `OPENAI_API_KEY` | For OpenAI Q&A | Server-only, only if using OpenAI provider |

Never commit real secrets. Use `.env.local` locally and Vercel env vars in production.

## Supabase setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Link the project and set env vars (see above).
3. Apply migrations:

```bash
# With Supabase CLI linked to your project
supabase db push
```

Or run the SQL files in `supabase/migrations/` via the Supabase SQL editor in order:
- `20250101000000_initial_schema.sql`
- `20250101000001_seed_demo_data.sql`
- `20250102000000_phase1_schema.sql`
- `20250102000001_phase1_seed_demo.sql`
- `20260903180000_tariff_schema_v1_1.sql`

Migrations enable RLS: public read on published catalog; tenant isolation for orgs/quotes; API keys verified server-side only.

## Tariff schema v1.1 (loader readiness)

Migration `20260903180000_tariff_schema_v1_1.sql` applies locked clean/v1.1 schema decisions **without importing data**:

- `tariffs.monthly_price` is `NUMERIC(12,2)` USD monthly from matrix `prima_mensual_con_imp` (dollars, not cents; never divide BMI annual values by 12).
- Additive loader columns: `plan_version_id`, `grupo_asegurado`, `tax_included`, `tax_basis_raw`; plans provenance fields; `coverage_status` extended with `unknown` plus nullable `coverage_status_text`.
- **Preview and production Excel load remains gated** until clean/v1.1 SHA approval from Mike's package.
- **RED1/RED2 region mapping and tax policy remain open** — not resolved in this PR.
- **No production data** is imported or modified by this migration.

## API B2B (v1)

- Docs: `/developers` — OpenAPI spec at `/openapi.json`
- Demo API key (local only): `cov_demo_test_key_phase1_only`
- Endpoints: `/api/v1/insurers`, `/plans`, `/plan-versions`, `/tariffs`, `/quotes`, `/coverage/qa`
- `POST /api/v1/quotes` (scope `write:quotes`) creates a quote pinned to the tariff row and plan-conditions version it was priced with; `requote_of` re-prices an existing quote. See [Quote version pins](#quote-version-pins).

## Quote version pins

A proposal must be reproducible after a new tariff loads. `quotes` already carried `plan_version_id` (the quoted plan version) and `tariff_id` (plan-level tariff link); migration `20261119110000_quotes_version_refs.sql` adds the two explicit version references:

| Column | References | Meaning |
|--------|------------|---------|
| `tariff_version_id` | `public.tariffs(id)` | The exact tariff matrix row that produced `monthly_price` |
| `plan_conditions_version_id` | `public.plan_versions(id)` | The version whose conditions (deductibles, coinsurance, copays, payment modality, ceilings, exclusions, waiting periods) were priced |

- Both columns are **nullable** so quotes created before this migration stay valid; the migration backfills them from `tariff_id` / `plan_version_id` only when the referenced tariff still belongs to the quoted plan.
- Both are `ON DELETE SET NULL`: deleting a tariff or version never blocks catalog cleanup and never erases the quote, which keeps its own `monthly_price` snapshot.
- Triggers reject a pin that points at a tariff row or version from another plan, and reject repointing a recorded pin. Only filling a previously `NULL` pin is allowed.
- `monthly_price`, the tariff dimensions and both version ids are also written into `quotes.metadata` as `pricing_snapshot` / `versions`, so a proposal can be replayed without joining the catalog.

**Loading a new tariff does not change existing quotes.** A re-quote (`POST /api/v1/quotes` with `requote_of`) creates a **new** quote row, diffs it against the current catalog (`tariff_changed`, `conditions_changed`, `price_changed`) and records `re_quote_of` plus `previous_versions` in its metadata. The original quote keeps its own pins and price as the record of what the customer was shown.

Local verification: `npm run test:migrations:ephemeral` (with a **local** `DATABASE_URL`) applies every migration and then runs `supabase/tests/quotes_version_refs.sql`, which asserts the acceptance criteria — backfill, mismatch rejection, pin immutability, tariff-load isolation, re-quote after a bump, and pin clearing on tariff delete.

## Vercel deployment

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Set environment variables in Project Settings → Environment Variables.
3. Deploy. Next.js builds with zero Supabase config (demo mode) or with vars for live persistence.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Vitest unit tests |

## Demo data notice

All plans and prices shown are **example data** for demonstration. They are not real insurance products or live quotes.
