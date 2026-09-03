import type { Metadata } from "next";
import { ContactForm } from "@/components/contacto/ContactForm";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contáctanos para consultas sobre CoverÜ y comparación de seguros.",
};

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Contacto</h1>
      <p className="mt-2 text-coveru-gray">
        Escríbenos y te responderemos a la brevedad.
      </p>
      <div className="mt-8">
        <ContactForm source="contacto" />
      </div>
    </div>
  );
}
