# CoverÜ insurer logos (v1.3 carriers)

Static assets for the three v1.3 catalog insurers: **BMI**, **Confiamed**, and **Saludsa**.

## Files

| Carrier   | Primary path              | Notes                                      |
| --------- | ------------------------- | ------------------------------------------ |
| BMI       | `/insurers/bmi.png`       | Horizontal lockup                          |
| BMI       | `/insurers/bmi-mark.png`  | Square mark for compact UI slots only      |
| Confiamed | `/insurers/confiamed.png`  | Wordmark + icon                            |
| Saludsa   | `/insurers/saludsa.svg`   | Preferred vector source                    |
| Saludsa   | `/insurers/saludsa.png`   | Raster fallback for non-SVG slots          |

ConfiPlus is a Confiamed product line — not a separate insurer.

## Setup

1. Copy assets into `public/insurers/` (this folder).
2. Set `insurers.logo_url` in the catalog (CSV loader or migration) to the primary path for each carrier.
3. In UI, always render **logo + insurer name together** — never the logo alone.
4. Demo labeling stays unchanged; displaying a carrier logo is **not** a partnership or endorsement claim.
