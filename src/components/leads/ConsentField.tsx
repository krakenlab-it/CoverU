"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LEAD_CONSENT_LABEL } from "@/lib/leads/consent";

interface ConsentFieldProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Message shown when the visitor submitted without consenting. */
  error?: string | null;
}

/**
 * Consent gate shared by the contact form and the quoter lead form. The label
 * is a placeholder pending approved LOPDP copy (KAN-238); the API rejects any
 * lead that does not carry consent, so this is a UI affordance, not the guard.
 */
export function ConsentField({
  id,
  checked,
  onCheckedChange,
  error = null,
}: ConsentFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          name={id}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5"
        />
        <Label htmlFor={id} className="text-sm leading-snug font-normal">
          {LEAD_CONSENT_LABEL}
        </Label>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
