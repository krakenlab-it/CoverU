# CoverÜ

Comparador de seguros de salud en Chile — Next.js App Router + Supabase.

## Features

- Spanish landing with CoverÜ wordmark, Poppins font, and brand red `#DF0926`
- Responsive header and footer
- `/comparar` — age/gender/region gate with demo plan cards showing "tú pagas $X", honest limits, and expandable details
- Static pages: `/nosotros`, `/agentes`, `/contacto`, `/faqs`
- `/api/leads` — lead capture API
- Supabase migrations for `insurers`, `plans`, `tariffs`, and `leads`
- Demo data unmistakably labeled as `[DEMO]` / "DEMO — datos de ejemplo"

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase env vars, the app runs in demo mode using in-memory example data.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | For persistence | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For persistence | Supabase anon (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | For lead API | Server-only service role key |

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

Migrations enable RLS: public read on catalog tables; leads insert/read via service role only.

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
