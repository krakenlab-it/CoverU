"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ConsentField } from "@/components/leads/ConsentField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitLead, type LeadPayload } from "@/lib/leads/client";
import { LEAD_CONSENT_VERSION } from "@/lib/leads/consent";
import { fieldIssues, quoterLeadSchema } from "@/lib/validation";

/** Which action produced the submission. `advisor` is the human queue. */
type LeadAction = "quote" | "advisor";

interface LeadCaptureFormProps {
  /** Age from the quoter profile; the lead reuses it instead of asking twice. */
  age: string;
  /** Human-readable profile summary from the live quote. */
  profileSummary: string;
  /** Where the lead came from, stored on public.leads.source. */
  source?: string;
}

type FieldIssues = Record<string, string>;

const NO_ISSUES: FieldIssues = {};

export function LeadCaptureForm({
  age,
  profileSummary,
  source = "cotizador",
}: LeadCaptureFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dependents, setDependents] = useState("0");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [currentInsurance, setCurrentInsurance] = useState("");
  const [consent, setConsent] = useState(false);
  const [issues, setIssues] = useState<FieldIssues>(NO_ISSUES);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<LeadAction | null>(null);
  const [accepted, setAccepted] = useState<LeadAction | null>(null);
  const confirmationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!accepted) return;
    confirmationRef.current?.focus();
  }, [accepted]);

  const handleSubmit = useCallback(
    async (intent: LeadAction) => {
      const parsed = quoterLeadSchema.safeParse({
        intent,
        name,
        email,
        phone,
        source,
        plan_interest: profileSummary,
        qualification: {
          age,
          dependents,
          city,
          budget,
          current_insurance: currentInsurance,
        },
        consent,
        consent_version: LEAD_CONSENT_VERSION,
      });

      if (!parsed.success) {
        setIssues(fieldIssues(parsed.error));
        setFormError(null);
        return;
      }

      const payload: LeadPayload = {
        intent: parsed.data.intent,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        source: parsed.data.source,
        plan_interest: parsed.data.plan_interest,
        qualification: {
          age: parsed.data.qualification.age,
          dependents: parsed.data.qualification.dependents,
          city: parsed.data.qualification.city,
          budget: parsed.data.qualification.budget ?? null,
          current_insurance: parsed.data.qualification.current_insurance ?? null,
        },
        consent: true,
        consent_version: parsed.data.consent_version ?? LEAD_CONSENT_VERSION,
      };

      setIssues(NO_ISSUES);
      setFormError(null);
      setPendingAction(intent);

      try {
        const result = await submitLead(payload);
        setAccepted(result.needsHumanFollowup ? "advisor" : intent);
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "No pudimos enviar tu solicitud.",
        );
      } finally {
        setPendingAction(null);
      }
    },
    [
      age,
      budget,
      city,
      consent,
      currentInsurance,
      dependents,
      email,
      name,
      phone,
      profileSummary,
      source,
    ],
  );

  if (accepted) {
    return (
      <Card role="status">
        <CardContent className="p-6">
          <div ref={confirmationRef} tabIndex={-1} className="space-y-2 outline-none">
            <p className="font-medium text-foreground">
              {accepted === "advisor"
                ? "Listo. Un asesor te contactará para revisar tu cotización."
                : "Listo. Guardamos tus datos para dar seguimiento a tu cotización."}
            </p>
            <p className="text-sm text-muted-foreground">
              Te escribiremos a {email.trim()} para coordinar el siguiente paso.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const issue = (field: string): string | null =>
    issues[field] ?? issues[`qualification.${field}`] ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tus datos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Déjanos tus datos para dar seguimiento a tu cotización. Tu perfil
          cotizado es {profileSummary}.
        </p>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit("quote");
          }}
          aria-label="Datos de contacto"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-name">Nombre</Label>
              <Input
                id="lead-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                aria-invalid={Boolean(issue("name"))}
                aria-describedby={issue("name") ? "lead-name-error" : undefined}
                className="h-11 rounded-lg text-base sm:h-9"
              />
              {issue("name") ? (
                <p id="lead-name-error" className="text-sm text-destructive">
                  {issue("name")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                aria-invalid={Boolean(issue("email"))}
                aria-describedby={issue("email") ? "lead-email-error" : undefined}
                className="h-11 rounded-lg text-base sm:h-9"
              />
              {issue("email") ? (
                <p id="lead-email-error" className="text-sm text-destructive">
                  {issue("email")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-phone">Teléfono (opcional)</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                className="h-11 rounded-lg text-base sm:h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-dependents">Dependientes</Label>
              <Input
                id="lead-dependents"
                type="number"
                inputMode="numeric"
                min={0}
                max={20}
                value={dependents}
                onChange={(event) => setDependents(event.target.value)}
                aria-invalid={Boolean(issue("dependents"))}
                aria-describedby={
                  issue("dependents") ? "lead-dependents-error" : undefined
                }
                className="h-11 rounded-lg text-base sm:h-9"
              />
              {issue("dependents") ? (
                <p id="lead-dependents-error" className="text-sm text-destructive">
                  {issue("dependents")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-city">Ciudad</Label>
              <Input
                id="lead-city"
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                autoComplete="address-level2"
                placeholder="Quito, Guayaquil, Cuenca…"
                aria-invalid={Boolean(issue("city"))}
                aria-describedby={issue("city") ? "lead-city-error" : undefined}
                className="h-11 rounded-lg text-base sm:h-9"
              />
              {issue("city") ? (
                <p id="lead-city-error" className="text-sm text-destructive">
                  {issue("city")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-budget">
                Presupuesto mensual (USD, opcional)
              </Label>
              <Input
                id="lead-budget"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="80"
                aria-invalid={Boolean(issue("budget"))}
                aria-describedby={issue("budget") ? "lead-budget-error" : undefined}
                className="h-11 rounded-lg text-base sm:h-9"
              />
              {issue("budget") ? (
                <p id="lead-budget-error" className="text-sm text-destructive">
                  {issue("budget")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="lead-current-insurance">
                Seguro actual (opcional)
              </Label>
              <Input
                id="lead-current-insurance"
                type="text"
                value={currentInsurance}
                onChange={(event) => setCurrentInsurance(event.target.value)}
                placeholder="Saludsa, Confiamed, BMI, otro — o “Ninguno”"
                aria-invalid={Boolean(issue("current_insurance"))}
                aria-describedby={
                  issue("current_insurance")
                    ? "lead-current-insurance-error"
                    : undefined
                }
                className="h-11 rounded-lg text-base sm:h-9"
              />
              {issue("current_insurance") ? (
                <p
                  id="lead-current-insurance-error"
                  className="text-sm text-destructive"
                >
                  {issue("current_insurance")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <ConsentField
              id="lead-consent"
              checked={consent}
              onCheckedChange={setConsent}
              error={issue("consent")}
            />
          </div>

          {formError ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              variant="brand"
              className="h-11 w-full rounded-full text-base sm:h-9 sm:w-auto sm:px-8 sm:text-sm"
              disabled={pendingAction !== null}
            >
              {pendingAction === "quote" ? "Enviando…" : "Enviar mis datos"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-full text-base sm:h-9 sm:w-auto sm:px-8 sm:text-sm"
              disabled={pendingAction !== null}
              onClick={() => {
                void handleSubmit("advisor");
              }}
            >
              {pendingAction === "advisor" ? "Enviando…" : "Hablar con un asesor"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
