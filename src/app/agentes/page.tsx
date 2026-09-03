import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Agentes",
  description: "Información para agentes y corredores de seguros interesados en CoverÜ.",
};

export default function AgentesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Agentes</h1>
      <div className="mt-6 space-y-4 text-foreground/80">
        <p>
          CoverÜ está diseñado para que agentes y corredores de seguros puedan
          orientar a sus clientes con información clara y comparable. Buscamos
          partners que valoren la transparencia en la venta de planes de salud.
        </p>
        <p>
          Si eres agente o corredor y quieres conocer cómo participar cuando
          abramos la plataforma a productos reales, contáctanos.
        </p>
        <Link
          href="/contacto"
          className="inline-block rounded-full bg-coveru-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-coveru-red-dark"
        >
          Contactar a CoverÜ
        </Link>
      </div>
    </div>
  );
}
