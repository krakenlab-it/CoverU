import { ContactForm } from "@/components/contacto/ContactForm";
import { PageContainer } from "@/components/platform/PageContainer";
import { PageHeader } from "@/components/platform/PageHeader";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata = buildPublicMetadata({
  title: "Contacto",
  description: "Contáctanos para consultas sobre CoverÜ y comparación de seguros en Ecuador.",
  path: "/contacto",
});

export default function ContactoPage() {
  return (
    <PageContainer size="narrow">
      <PageHeader
        title="Contacto"
        description="Escríbenos y te responderemos a la brevedad."
        className="mb-8"
      />
      <ContactForm source="contacto" />
    </PageContainer>
  );
}
