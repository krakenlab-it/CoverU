"use client";

import { useState } from "react";
import { PlanCard } from "@/components/comparar/PlanCard";
import { DEMO_BADGE_LABEL } from "@/lib/constants";
import type { ComparisonResult } from "@/lib/types/database";
import { CHILE_REGIONS, GENDER_OPTIONS } from "@/lib/regions";

interface ComparisonGateProps {
  initialResults?: ComparisonResult[];
}

export function ComparisonGate({ initialResults = [] }: ComparisonGateProps) {
  const [age, setAge] = useState<string>("30");
  const [gender, setGender] = useState<string>("femenino");
  const [region, setRegion] = useState<string>("metropolitana");
  const [results, setResults] = useState<ComparisonResult[]>(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(initialResults.length > 0);

  async function handleCompare(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const ageNum = parseInt(age, 10);
    if (Number.isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
      setError("Ingresa una edad válida entre 18 y 99 años.");
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        age: String(ageNum),
        gender,
        region,
      });
      const response = await fetch(`/api/compare?${params.toString()}`);
      if (!response.ok) {
        throw new Error("No pudimos cargar los planes. Intenta de nuevo.");
      }
      const data = (await response.json()) as { results: ComparisonResult[] };
      setResults(data.results);
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al comparar planes.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCompare}
        className="rounded-2xl border border-coveru-border bg-white p-6 shadow-sm"
        aria-label="Filtros de comparación"
      >
        <h2 className="text-lg font-bold text-foreground">
          Cuéntanos sobre ti
        </h2>
        <p className="mt-1 text-sm text-coveru-gray">
          Usamos edad, género y región para mostrar tarifas de ejemplo
          relevantes.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Edad</span>
            <input
              type="number"
              min={18}
              max={99}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-1 focus:ring-coveru-red"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Género</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-1 focus:ring-coveru-red"
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Región</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-1 focus:ring-coveru-red"
            >
              {CHILE_REGIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p className="mt-4 text-sm text-coveru-red" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-coveru-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-coveru-red-dark disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Buscando planes…" : "Comparar planes"}
        </button>
      </form>

      {searched && (
        <section aria-label="Resultados de comparación">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">
              Planes disponibles
            </h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {DEMO_BADGE_LABEL}
            </span>
          </div>

          {results.length === 0 ? (
            <p className="rounded-xl border border-coveru-border bg-coveru-light p-6 text-sm text-coveru-gray">
              No encontramos planes de ejemplo para estos criterios. Prueba otra
              combinación de edad, género o región.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <PlanCard
                  key={result.tariff.id}
                  result={result}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
