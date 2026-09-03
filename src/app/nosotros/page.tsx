import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Conoce CoverÜ y nuestra misión de transparencia en seguros de salud.",
};

export default function NosotrosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Nosotros</h1>
      <div className="mt-6 space-y-4 text-foreground/80">
        <p>
          CoverÜ nace con la misión de hacer más transparente la comparación de
          seguros de salud en Chile. Creemos que cada persona debe entender qué
          paga, qué cubre su plan y qué limitaciones tiene antes de contratar.
        </p>
        <p>
          Nuestro comparador muestra precios con la etiqueta &ldquo;tú pagas
          $X&rdquo;, deducibles, copagos, topes anuales y exclusiones de forma
          clara y expandible.
        </p>
        <p>
          En esta etapa inicial trabajamos con datos de demostración mientras
          integramos aseguradoras y tarifas reales. No publicamos precios ni
          promesas de cobertura que no podamos respaldar.
        </p>
      </div>
    </div>
  );
}
