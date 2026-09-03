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

Migrations enable RLS: public read on published catalog; tenant isolation for orgs/quotes; API keys verified server-side only.

## API B2B (v1)

- Docs: `/developers` — OpenAPI spec at `/openapi.json`
- Demo API key (local only): `cov_demo_test_key_phase1_only`
- Endpoints: `/api/v1/insurers`, `/plans`, `/plan-versions`, `/tariffs`, `/quotes`, `/coverage/qa`

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
