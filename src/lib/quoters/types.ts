import type { TariffRegion } from "@/lib/catalog-enums";

export const QUOTE_GENDERS = ["femenino", "masculino"] as const;
export type QuoteGender = (typeof QUOTE_GENDERS)[number];

export const QUOTE_AGE_MIN = 18;
export const QUOTE_AGE_MAX = 99;

/** Cheapest offers rendered on the public quoter; the rest stay behind a count. */
export const PUBLIC_QUOTE_OFFERS_LIMIT = 12;

export interface QuoteRequest {
  age: number;
  gender: QuoteGender;
  region: TariffRegion;
}

/**
 * One quotable plan for the requested profile. `isDemo` is true only for rows
 * flagged as demo in the database, never for catalog rows.
 */
export interface PublicQuoteOffer {
  planId: string;
  planName: string;
  insurerName: string;
  insurerSlug: string;
  insurerLogoUrl: string | null;
  monthlyPrice: number;
  deductible: number | null;
  annualLimit: number | null;
  region: TariffRegion;
  ageMin: number;
  ageMax: number;
  gender: "any" | QuoteGender;
  isDemo: boolean;
}

/** Where the quoted rows came from: hosted Supabase or the committed package. */
export type QuoteSource = "supabase" | "bundled-catalog";

export interface PublicQuoteResult {
  request: QuoteRequest;
  offers: PublicQuoteOffer[];
  /** Total matching plans before the display limit is applied. */
  totalOffers: number;
  source: QuoteSource;
}
