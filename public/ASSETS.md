# CoverÜ public assets

Drop branded static files into `public/` using these exact filenames. No code changes are required after adding them.

| File | Purpose |
|------|---------|
| `favicon.ico` | Browser tab icon (fallback) |
| `icon-192.png` | PWA / manifest icon (192×192) |
| `icon-512.png` | PWA / manifest icon (512×512) |
| `apple-touch-icon.png` | iOS home screen (180×180) |
| `og-coveru.png` | Static Open Graph fallback (1200×630) |

Until these files are added, the app uses generated `icon.tsx`, `apple-icon.tsx`, and `opengraph-image.tsx` routes.

Optional Sam asset pack: replace the generated routes by adding the files above and updating `src/lib/seo/site.ts` `DEFAULT_OG_IMAGE` if needed.
