import { BentoGrid } from "@/components/marketing/BentoGrid";
import { FaqSection } from "@/components/marketing/FaqSection";
import { HeroCarousel } from "@/components/marketing/HeroCarousel";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { MembersSection } from "@/components/marketing/MembersSection";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";
import { MARKETING_SITE_NAME } from "@/lib/constants";

export const metadata = buildPublicMetadata({
  path: "/",
  title: "Seguros Para Empresa y Personas",
  description:
    "Encuentra el seguro de salud ideal y contrátalo 100% en línea. Compara planes con Cover U.",
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: MARKETING_SITE_NAME,
  url: absoluteUrl("/"),
  description:
    "Encuentra el seguro de salud ideal y contrátalo 100% en línea con Cover U.",
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
      <HeroCarousel />
      <HowItWorks />
      <BentoGrid />
      <MembersSection />
      <FaqSection />
    </>
  );
}
