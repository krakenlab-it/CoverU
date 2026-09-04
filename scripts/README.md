# Scripts

Operational utilities for CoverU. These scripts are **not** run in CI and never write to production from GitHub Actions.

## Catalog v1.3 loader

Loads real Ecuador tariff data from `data/catalog/v1.3/` into Supabase (insurers → plans → plan_versions → tariffs). The loader:

- Uses service-role credentials (`SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`, plus `SUPABASE_SERVICE_ROLE_KEY`)
- Upserts by primary IDs from the CSV package (idempotent / re-run safe)
- **Publishes** `plan_versions` (`status=published`, `published_at=now()` UTC) so the marketplace is not empty
- Backfills `tariffs.plan_version_id` from each plan's `version_number=1` row
- Skips and reports `load_blocked` tariff rows
- Prints table counts before and after
- Never loads `*_seed_demo*.sql`

### Dry run (local, no secrets)

Validates CSV parsing and prints expected counts without touching the database:

```bash
npm run catalog:load:dry-run
```

Optional custom data path:

```bash
npm run catalog:load:dry-run -- --data-dir ./data/catalog/v1.3
```

### Load preview / staging Supabase

Export credentials for your **preview** Supabase project (never commit these):

```bash
export SUPABASE_URL="https://<preview-ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<preview-service-role-key>"
npm run catalog:load
```

### Load production

Same command with **production** credentials — run only from a trusted operator machine after preview verification:

```bash
export SUPABASE_URL="https://<prod-ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<prod-service-role-key>"
npm run catalog:load
```

Steve runs this against Cover-U-DB after the PR merges.

### Expected package (Mike clean v1.3)

| File | Rows |
|------|------|
| `insurers.csv` | 3 |
| `plans.csv` | 141 |
| `plan_versions.csv` | 141 (draft in CSV; published on load) |
| `tariffs.csv` | 6137 loadable |
| `MANIFEST.json`, `SHA256SUMS` | checksum metadata |

Coverage tables (`coverage_clauses`, `exclusions`, etc.) are header-only in v1.3 — the loader does not invent coverage text.

## Visual asset integration

```bash
npm run integrate:visual-pack
```

Copies Sam's visual pack into `public/` (see `scripts/integrate-sam-visual-pack.sh`).
