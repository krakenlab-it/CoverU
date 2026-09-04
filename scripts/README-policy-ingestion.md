# Policy document ingestion (future)

CoverU **does not** scrape Google Drive from the application runtime. Policy PDFs and prompt text files in Drive (e.g. Saludsa precios PDFs) must be ingested offline.

## Recommended pipeline

1. Export or download source PDFs / text from Drive to a controlled staging bucket or `data/policy-sources/`.
2. Run a dedicated script (not wired to Next.js routes) that:
   - Parses PDF text per insurer/plan
   - Inserts rows into `policy_documents`, `coverage_clauses`, `exclusions`, `waiting_periods`, and `citations`
   - Stores **verbatim excerpts** in `citations.excerpt` with real `clause_ref` values from the source
3. Validate with SQL checks: zero citations without matching `policy_document_id`; no orphan clause refs.
4. Publish `plan_versions` only after citations are verified.

## v1.3 note

The v1.3 tariff load fills `insurers`, `plans`, `plan_versions`, and `tariffs` only. Coverage catalog tables may remain empty until this ingestion runs. The coverage QA agent **abstains** on policy wording when those tables are empty and answers tariff/price questions from `tariffs` alone.

## Do not

- Invent article numbers (e.g. `Art. 4.1`) in application code or seed data without a source document row.
- Import the full 6137-row tariff Excel in the coverage agent PR — use the existing catalog loader/migrations instead.
