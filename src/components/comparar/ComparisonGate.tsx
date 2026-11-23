"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LeadCaptureForm } from "@/components/comparar/LeadCaptureForm";
import { PlanCard } from "@/components/comparar/PlanCard";
import { EmptyState } from "@/components/platform/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GENDER_OPTIONS,
  TARIFF_REGIONS,
  getGenderLabel,
  type TariffRegion,
} from "@/lib/catalog-enums";
import { formatUsd } from "@/lib/marketplace/format";
import {
  PUBLIC_QUOTE_OFFERS_LIMIT,
  QUOTE_AGE_MAX,
  QUOTE_AGE_MIN,
  type PublicQuoteOffer,
  type PublicQuoteResult,
  type QuoteGender,
} from "@/lib/quoters/types";

const DEFAULT_AGE = "30";
const DEFAULT_GENDER: QuoteGender = "femenino";
const DEFAULT_REGION: TariffRegion = "Nacional";

interface ComparisonGateProps {
  /** Server-fetched quote so the first screen already shows real tariffs. */
  initialQuote?: PublicQuoteResult | null;
}

function validateAge(raw: string): string | null {
  const age = Number(raw);
  if (!Number.isInteger(age) || age < QUOTE_AGE_MIN || age > QUOTE_AGE_MAX) {
    return `Ingresa una edad entre ${QUOTE_AGE_MIN} y ${QUOTE_AGE_MAX} años.`;
  }
  return null;
}

interface QuoteRequestBody {
  age: number;
  gender: QuoteGender;
  region: TariffRegion;
}

async function requestQuote(body: QuoteRequestBody): Promise<PublicQuoteResult> {
  const search = new URLSearchParams({
    age: String(body.age),
    gender: body.gender,
    region: body.region,
  });
  const response = await fetch(`/api/compare?${search.toString()}`);
  if (!response.ok) {
    throw new Error(
      "No pudimos cargar las tarifas del catálogo. Intenta de nuevo.",
    );
  }
  return (await response.json()) as PublicQuoteResult;
}

export function ComparisonGate({ initialQuote = null }: ComparisonGateProps) {
  const [age, setAge] = useState(
    initialQuote ? String(initialQuote.request.age) : DEFAULT_AGE,
  );
  const [gender, setGender] = useState<QuoteGender>(
    initialQuote?.request.gender ?? DEFAULT_GENDER,
  );
  const [region, setRegion] = useState<TariffRegion>(
    initialQuote?.request.region ?? DEFAULT_REGION,
  );
  const [quote, setQuote] = useState<PublicQuoteResult | null>(initialQuote);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement | null>(null);

  const isStale =
    quote !== null &&
    (quote.request.age !== Number(age) ||
      quote.request.gender !== gender ||
      quote.request.region !== region);

  useEffect(() => {
    if (!quote) return;
    resultsRef.current?.focus();
  }, [quote]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const ageError = validateAge(age);
      if (ageError) {
        setError(ageError);
        return;
      }

      setError(null);
      setLoading(true);
      try {
        setQuote(
          await requestQuote({ age: Number(age), gender, region }),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cotizar el plan.",
        );
      } finally {
        setLoading(false);
      }
    },
    [age, gender, region],
  );

  const offers = quote?.offers ?? [];
  const visibleOffers = offers.slice(0, PUBLIC_QUOTE_OFFERS_LIMIT);
  const totalOffers = quote?.totalOffers ?? 0;
  const cheapest: PublicQuoteOffer | null = visibleOffers[0] ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cuéntanos sobre ti</CardTitle>
          <p className="text-sm text-muted-foreground">
            Con edad, género y región calculamos tu prima mensual en el
            catálogo de Saludsa, Confiamed y BMI.
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            aria-label="Cotizador de planes"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="quote-age">Edad</Label>
                <Input
                  id="quote-age"
                  type="number"
                  inputMode="numeric"
                  min={QUOTE_AGE_MIN}
                  max={QUOTE_AGE_MAX}
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  autoComplete="off"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "quote-error" : undefined}
                  className="h-11 rounded-lg text-base sm:h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-gender">Género</Label>
                <select
                  id="quote-gender"
                  value={gender}
                  onChange={(event) =>
                    setGender(event.target.value as QuoteGender)
                  }
                  className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-9 dark:bg-input/30"
                >
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote-region">Región</Label>
                <select
                  id="quote-region"
                  value={region}
                  onChange={(event) =>
                    setRegion(event.target.value as TariffRegion)
                  }
                  className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-9 dark:bg-input/30"
                >
                  {TARIFF_REGIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error ? (
              <p
                className="mt-4 text-sm text-destructive"
                role="alert"
                id="quote-error"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="brand"
              className="mt-4 h-11 w-full rounded-full text-base sm:h-9 sm:w-auto sm:px-8 sm:text-sm"
              disabled={loading}
            >
              {loading
                ? "Calculando…"
                : quote
                  ? "Actualizar cotización"
                  : "Ver mi plan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {quote ? (
        <section
          ref={resultsRef}
          tabIndex={-1}
          aria-label="Resultados de cotización"
          aria-live="polite"
          className="scroll-mt-20 space-y-4 outline-none"
        >
          {cheapest ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Desde
              </p>
              <p className="text-2xl font-bold text-foreground sm:text-3xl">
                {formatUsd(cheapest.monthlyPrice)}
                <span className="ml-1 text-sm font-normal text-foreground/70">
                  /mes
                </span>
              </p>
              <p className="mt-1 text-sm text-foreground/80">
                {cheapest.insurerName} · {cheapest.planName} · {totalOffers}{" "}
                {totalOffers === 1 ? "plan" : "planes"} para tu perfil
              </p>
            </div>
          ) : null}

          {isStale ? (
            <p className="text-sm text-muted-foreground" role="status">
              Cambiaste tu perfil. Actualiza la cotización para ver las tarifas
              nuevas.
            </p>
          ) : null}

          {visibleOffers.length === 0 ? (
            <EmptyState
              title="Sin planes para este perfil"
              description="Prueba otra edad, género o región. El catálogo cubre edades de 18 a 99 años."
            />
          ) : (
            <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleOffers.map((offer) => (
                <li key={offer.planId}>
                  <PlanCard offer={offer} />
                </li>
              ))}
            </ul>
          )}

          {totalOffers > visibleOffers.length ? (
            <p className="text-sm text-muted-foreground">
              Mostrando los {visibleOffers.length} planes más económicos de{" "}
              {totalOffers}.
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Prima mensual en USD con impuestos incluidos, según el catálogo
            vigente. La aseguradora confirma el precio final al emitir la
            póliza.
          </p>
        </section>
      ) : null}

      {quote && cheapest ? (
        <LeadCaptureForm
          age={String(quote.request.age)}
          profileSummary={`${quote.request.age} años · ${getGenderLabel(
            quote.request.gender,
          )} · ${quote.request.region}`}
          source="cotizador"
        />
      ) : null}
    </div>
  );
}
