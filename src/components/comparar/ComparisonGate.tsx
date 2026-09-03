"use client";

import { useState } from "react";
import { PlanCard } from "@/components/comparar/PlanCard";
import { DemoBadge } from "@/components/platform/DemoBadge";
import { EmptyState } from "@/components/platform/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComparisonResult } from "@/lib/types/database";
import { DEMO_REGIONS, GENDER_OPTIONS } from "@/lib/regions";

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
      <Card>
        <CardHeader>
          <CardTitle>Cuéntanos sobre ti</CardTitle>
          <p className="text-sm text-muted-foreground">
            Usamos edad, género y provincia para mostrar tarifas de ejemplo
            relevantes.
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCompare}
            aria-label="Filtros de comparación"
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="compare-age">Edad</Label>
                <Input
                  id="compare-age"
                  type="number"
                  min={18}
                  max={99}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  aria-invalid={Boolean(error)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compare-gender">Género</Label>
                <select
                  id="compare-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compare-region">Provincia</Label>
                <select
                  id="compare-region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {DEMO_REGIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert" id="compare-error">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="brand"
              className="w-full rounded-full sm:w-auto"
              disabled={loading}
              aria-describedby={error ? "compare-error" : undefined}
            >
              {loading ? "Buscando planes…" : "Comparar planes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searched ? (
        <section aria-label="Resultados de comparación">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">Planes disponibles</h2>
            <DemoBadge />
          </div>

          {results.length === 0 ? (
            <EmptyState
              title="Sin resultados para estos criterios"
              description="Prueba otra combinación de edad, género o provincia."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <PlanCard key={result.tariff.id} result={result} />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
