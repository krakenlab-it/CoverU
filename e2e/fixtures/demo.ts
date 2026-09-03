/** Phase-1 demo plan version seeded in `20250102000001_phase1_seed_demo.sql`. */
export const DEMO_PLAN_VERSION_ID = "d1000000-0000-4000-8000-000000000001";

/**
 * Public `/comparar` still falls back to in-memory demo data when Supabase is unset.
 * Authenticated `/app` routes require real Supabase auth (see `e2e/helpers/auth.ts`).
 */
export const PUBLIC_DEMO_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  COVERAGE_QA_PROVIDER: "demo",
};
