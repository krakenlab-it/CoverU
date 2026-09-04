# CoverU catalog v1.3

Load candidate from Mike clean package `2026.09.03.1.3` (source branch: `cursor/v1-3-tariff-catalog-import`).

- **3** insurers
- **141** plans and plan_versions
- **6137** tariffs (`monthly_price` = USD monthly NUMERIC tax-included from `prima_mensual_con_imp`)
- `is_demo=false` throughout
- Coverage clause tables are **header-only** (0 data rows) — no invented coverage text

## Files

| File | Purpose |
|------|---------|
| `insurers.csv` | Insurer master |
| `plans.csv` | Plans keyed by `natural_key_plan_id` |
| `plan_versions.csv` | Draft v1 rows (`status=draft`, `published_at` empty in CSV) |
| `tariffs.csv` | Tariff matrix keyed by `plan_id` |
| `MANIFEST.json` | Package metadata and counts |
| `SHA256SUMS` | File checksums |

## Loading into Supabase

The marketplace only shows `plan_versions` with `status=published`. CSV rows arrive as draft — the loader **must publish** them on load.

See [scripts/README.md](../../scripts/README.md) for the full local → preview → prod pipeline:

```bash
# Validate parsing (no DB writes)
npm run catalog:load:dry-run

# Load preview or prod (service role required — never commit secrets)
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
npm run catalog:load
```

Schema: `tariff_schema_v1_3` migration on Cover-U-DB. Respects `tariffs_v1_3_load_grain_unique_idx` and CHECK constraints (`gender`, `region`, `grupo_asegurado`, `maternidad`).
