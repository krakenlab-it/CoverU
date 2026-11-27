# CoverÜ

Marketplace de seguros de salud y asistencia en **Ecuador** (MVP): cotizador B2C público y **CoverU Office** (área autenticada en `/app`) para equipos que operan catálogo, marketplace y API B2B.

**Stack:** Next.js 16, React 19, TypeScript, Supabase, zod, shadcn/ui, Vitest, Playwright.

## Producto (Ecuador)

| Superficie | Rutas | Rol |
|------------|-------|-----|
| **B2C — cotizador y marketing** | `/`, `/comparar`, páginas estáticas | Landing en español (`es-EC`), comparación por edad/género/región con precios en **USD**; datos de demostración claramente marcados hasta cargar el catálogo real |
| **CoverU Office** | `/app`, `/app/marketplace`, configuración y `/app/desarrolladores` | Panel para organizaciones: marketplace con búsqueda/filtros, comparación de planes, detalle de póliza, asistente de cobertura fundamentado, claves API y uso |
| **API B2B (v1)** | `/api/v1/*`, docs en `/developers` | Catálogo, cotizaciones, cobertura Q&A para integradores |

Sin variables de Supabase, la app arranca en **modo demo** con datos en memoria. El catálogo de producción para Ecuador proviene del paquete **clean/v1.3** (ver más abajo).

## Features

- Marca CoverÜ (Poppins, rojo `#DF0926`) y assets en `public/brand/`
- `/comparar` — puerta edad/género/región con tarjetas de plan, límites visibles y detalle expandible
- Páginas estáticas: `/nosotros`, `/agentes`, `/contacto`, `/faqs`
- `/api/leads` — captura de leads
- Migraciones Supabase: aseguradoras, planes, tarifas, leads, organizaciones, cotizaciones, API keys
- Marketplace autenticado, workspace de comparación, visor de detalle y asistente de cobertura
- Datos de ejemplo marcados como `[DEMO]` / "DEMO — datos de ejemplo"

## Catálogo v1.3 (Ecuador)

Paquete Mike **clean/v1.3** (`2026.09.03.1.3`) en `data/catalog/v1.3/`. Aseguradoras verificadas en `insurers.csv`:

| Aseguradora | Slug | Notas |
|-------------|------|--------|
| **BMI** | `bmi` | Matriz tarifaria mayoritaria en el paquete |
| **Confiamed** | `confiamed` | Incluye línea ConfiPlus (`maternidad` Si/No en tarifas) |
| **Saludsa** | `saludsa` | GMM en matriz v1.3 |

**Conteos del paquete** (`MANIFEST.json` y `data/catalog/v1.3/README.md`):

- **3** aseguradoras, **141** planes y `plan_versions`, **6137** filas de tarifa cargables (`is_demo=false` en CSV)
- Precio mensual vendible: `monthly_price` = USD `NUMERIC` con impuesto incluido (`prima_mensual_con_imp`, `tax_included=true`)
- Regiones tarifarias v1.3: `Nacional`, `Austro`, `Costa`, `Sierra`
- Tablas de cobertura en v1.3 (**coverage_clauses**, exclusions, waiting_periods, scenarios, policy_documents, citations): **0 filas de datos** — el loader no inventa texto de cobertura

**Carga a Supabase** (requiere service role; no corre en CI):

```bash
npm run catalog:load:dry-run   # validar CSV sin escribir
npm run catalog:load           # upsert + publicar plan_versions para marketplace
```

Ver `scripts/README.md` y `scripts/catalog-v1_3/`.

**Esquema DB:** migración `supabase/migrations/20260903190000_tariff_schema_v1_3.sql` — grain de carga, CHECKs alineados a v1.3, índice único `tariffs_v1_3_load_grain_unique_idx`. Comentarios de columna documentan campos dispersos (p. ej. `deductible` y `annual_limit` a menudo nulos fuera de BMI/Confiamed).

Logos v1.3: `supabase/migrations/20260904010000_insurer_logo_urls_v1_3.sql` y `public/insurers/USAGE.md`.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

- Sitio público: [http://localhost:3000](http://localhost:3000)
- Office / marketplace: [http://localhost:3000/app/marketplace](http://localhost:3000/app/marketplace) (demo sin Supabase)

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | For persistence | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For persistence | Supabase anon (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | For lead API / catalog load | Server-only service role key |
| `API_KEY_PEPPER` | For B2B API | Server-only pepper for API key hashing |
| `COVERAGE_QA_PROVIDER` | Optional | `demo` (default) or `openai` |
| `OPENAI_API_KEY` | For OpenAI Q&A | Server-only, only if using OpenAI provider |

Never commit real secrets. Use `.env.local` locally and Vercel env vars in production.

## Supabase setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Link the project and set env vars (see above).
3. Apply migrations (in order under `supabase/migrations/`), including `20260903190000_tariff_schema_v1_3.sql` before a load v1.3.

```bash
supabase db push
```

RLS: lectura pública del catálogo publicado; aislamiento por organización en cotizaciones/API keys.

## API B2B (v1)

- Docs: `/developers` — OpenAPI en `/openapi.json`
- Demo API key (local only): `cov_demo_test_key_phase1_only`
- Endpoints: `/api/v1/insurers`, `/plans`, `/plan-versions`, `/tariffs`, `/quotes`, `/coverage/qa`

## Vercel deployment

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Set environment variables in Project Settings → Environment Variables.
3. Deploy. Builds work with zero Supabase config (demo mode) or with vars for live persistence.

Release gates and CI: `docs/RELEASE_GATES.md`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke (local server) |
| `npm run catalog:load:dry-run` | Validate v1.3 CSV package |
| `npm run catalog:load` | Load v1.3 into Supabase |

## Demo data notice

All plans and prices shown in **demo mode** are example data. They are not live insurer quotes until the v1.3 catalog is loaded and published in your Supabase project.