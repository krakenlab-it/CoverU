import type { Metadata } from "next";
import { ComparisonGate } from "@/components/comparar/ComparisonGate";

export const metadata: Metadata = {
  title: "Comparar planes",
  description:
    "Compara planes de seguro de salud por edad, género y región. Datos de demostración.",
};

export default function CompararPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Comparar planes</h1>
        <p className="mt-2 text-coveru-gray">
          Ingresa tu edad, género y región para ver planes de ejemplo con
          precios y coberturas transparentes.
        </p>
      </div>
      <ComparisonGate />
    </div>
  );
}
