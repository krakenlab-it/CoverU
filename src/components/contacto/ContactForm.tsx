"use client";

import { useState } from "react";
import { ConsentField } from "@/components/leads/ConsentField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { submitLead } from "@/lib/leads/client";
import { LEAD_CONSENT_VERSION } from "@/lib/leads/consent";
import { contactLeadSchema, clearFieldIssue, fieldIssues } from "@/lib/validation";

interface ContactFormProps {
  source?: string;
}

type FieldIssues = Record<string, string>;

const NO_ISSUES: FieldIssues = {};

export function ContactForm({ source = "contacto" }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [issues, setIssues] = useState<FieldIssues>(NO_ISSUES);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsed = contactLeadSchema.safeParse({
      intent: "contact",
      name,
      email,
      phone,
      source,
      message,
      consent,
      consent_version: LEAD_CONSENT_VERSION,
    });

    if (!parsed.success) {
      setIssues(fieldIssues(parsed.error));
      setStatus("idle");
      setErrorMessage(null);
      return;
    }

    setIssues(NO_ISSUES);
    setStatus("loading");
    setErrorMessage(null);

    try {
      await submitLead({
        intent: "contact",
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        source,
        message: parsed.data.message,
        consent: true,
        consent_version: parsed.data.consent_version,
      });

      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setConsent(false);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Error al enviar el formulario.",
      );
    }
  }

  if (status === "success") {
    return (
      <Card role="status">
        <CardContent className="p-6 text-sm text-emerald-800">
          ¡Gracias! Recibimos tu mensaje y te contactaremos pronto.
        </CardContent>
      </Card>
    );
  }

  const issue = (field: string): string | null => issues[field] ?? null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="contact-name">Nombre</Label>
        <Input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          aria-invalid={Boolean(issue("name"))}
          aria-describedby={issue("name") ? "contact-name-error" : undefined}
        />
        {issue("name") ? (
          <p id="contact-name-error" className="text-sm text-destructive">
            {issue("name")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-invalid={Boolean(issue("email")) || status === "error"}
          aria-describedby={issue("email") ? "contact-email-error" : undefined}
        />
        {issue("email") ? (
          <p id="contact-email-error" className="text-sm text-destructive">
            {issue("email")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-phone">Teléfono (opcional)</Label>
        <Input
          id="contact-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Mensaje</Label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      <ConsentField
        id="contact-consent"
        checked={consent}
        onCheckedChange={(checked) => {
          setConsent(checked);
          if (checked) setIssues((current) => clearFieldIssue(current, "consent"));
        }}
        error={issue("consent")}
      />

      {status === "error" && errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="brand"
        className="rounded-full"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Enviando…" : "Enviar mensaje"}
      </Button>
    </form>
  );
}
