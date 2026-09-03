# CoverÜ visual assets (Sam's pack)

Copy files from `coveru-visual-system/` into `public/` using the paths below. **No code changes are required** — the app prefers static files when present and keeps generated OG/icon fallbacks until then.

## Status

Sam's pack was not readable on the shared filesystem during integration (`/workspace/coveru-visual-system` missing). Drop assets locally using this manifest, then rebuild.

## Brand lockups (`public/brand/`)

| Drop-in path | Purpose |
|--------------|---------|
| `brand/wordmark.svg` | Primary wordmark (header/footer, md size) |
| `brand/wordmark.png` | PNG fallback for wordmark |
| `brand/mark.svg` | Compact mark / favicon source (app nav sm) |
| `brand/mark.png` | PNG compact mark |
| `brand/lockup-horizontal.svg` | Horizontal lockup (hero, lg header) |
| `brand/lockup-horizontal.png` | PNG horizontal lockup |
| `brand/lockup-stacked.svg` | Stacked lockup (marketing) |
| `brand/lockup-stacked.png` | PNG stacked lockup |
| `brand/lockup-on-dark.svg` | Lockup for dark backgrounds (optional) |

## Favicons & PWA (`public/`)

| Drop-in path | Purpose |
|--------------|---------|
| `favicon.ico` | Browser tab icon |
| `icon-192.png` | PWA manifest 192×192 |
| `icon-512.png` | PWA manifest 512×512 |
| `apple-touch-icon.png` | iOS home screen 180×180 |

## Social preview (`public/`)

| Drop-in path | Purpose |
|--------------|---------|
| `og-coveru.png` | Open Graph image **1200×630** |
| `twitter-coveru.png` | Twitter/X card **1200×630** (optional; falls back to OG) |

`src/app/opengraph-image.tsx`, `icon.tsx`, and `apple-icon.tsx` automatically serve these files when present.

## State illustrations (`public/illustrations/`)

| Drop-in path | Purpose |
|--------------|---------|
| `illustrations/empty-state.svg` | Empty results (marketplace, comparar) |
| `illustrations/empty-state.png` | PNG fallback |
| `illustrations/error-state.svg` | Error / failed load states |
| `illustrations/error-state.png` | PNG fallback |
| `illustrations/loading.svg` | Loading skeleton companion |
| `illustrations/loading.png` | PNG fallback |

## Brand rules

- Primary red: `#DF0926`
- Copy: Spanish Ecuador (`es-EC`)
- Demo data must stay prominently labeled — no fake stats, prices, or insurer claims
- Do not retry Google Drive upload from the agent; copy from local `coveru-visual-system/` only

## Quick copy (from repo root)

```bash
# Example once the pack is available locally:
cp -r coveru-visual-system/public/* public/
npm run build
```
