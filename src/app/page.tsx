import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DemoAlert } from "@/components/platform/DemoAlert";
import { PageContainer } from "@/components/platform/PageContainer";
import { SectionHeader } from "@/components/platform/SectionHeader";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";
import { motion } from "@/lib/motion";

export const metadata = buildPublicMetadata({
  path: "/",
  title: "Comparador de seguros de salud",
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CoverÜ",
  url: absoluteUrl("/"),
  description:
    "Comparador de seguros de salud en Ecuador con datos de demostración.",
  inLanguage: "es-EC",
  potentialAction: {
    "@type": "SearchAction",
    target: absoluteUrl("/comparar"),
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="bg-gradient-to-b from-background to-muted/40">
        <PageContainer className="py-16 sm:py-24">
          <div className={motion.fadeIn}>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Seguros de salud en Ecuador
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              Encuentra el plan que{" "}
              <span className="text-primary">mejor se adapta</span> a ti
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              CoverÜ te ayuda a comparar planes de salud con precios claros,
              límites visibles y detalles expandibles. Actualmente mostramos
              datos de demostración hasta integrar aseguradoras reales.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="brand" size="lg" asChild className="rounded-full">
                <Link href="/comparar">Comparar planes</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="rounded-full">
                <Link href="/nosotros">Conocer CoverÜ</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        <SectionHeader
          title="¿Por qué CoverÜ?"
          description="Transparencia y claridad antes de contratar un seguro de salud."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Precios claros",
              body: 'Cada plan muestra "tú pagas $X" con deducible, copago y tope anual sin letra chica oculta.',
            },
            {
              title: "Límites honestos",
              body: "Exclusiones y topes visibles desde el inicio, con detalles expandibles para cada plan.",
            },
            {
              title: "Hecho para Ecuador",
              body: "Filtros por edad, género y provincia para comparar tarifas relevantes a tu situación.",
            },
          ].map((item) => (
            <Card key={item.title} className={motion.cardHover}>
              <CardContent className="p-6">
                <h3 className="font-semibold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>

      <section className="bg-muted/40">
        <PageContainer className="py-8">
          <DemoAlert />
        </PageContainer>
      </section>
    </>
  );
}
