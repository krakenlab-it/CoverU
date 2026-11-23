import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // The public quoter reads the committed v1.3 catalog when Supabase is unset,
  // so those CSV files must ship with the server bundle on Vercel.
  outputFileTracingIncludes: {
    "/comparar": ["./data/catalog/v1.3/*.csv"],
    "/api/compare": ["./data/catalog/v1.3/*.csv"],
  },
};

export default nextConfig;
