import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type CoveruEnvDiagnostics,
  classifyAnonKeyFromPrefix,
} from "@/lib/supabase/env-diagnostics";

type SetupErrorProps = {
  compact?: boolean;
  className?: string;
  diagnostics?: CoveruEnvDiagnostics;
};

function EnvVarStatus({
  name,
  present,
  detail,
}: {
  name: string;
  present: boolean;
  detail?: string;
}) {
  return (
    <li>
      <code className="text-xs">{name}</code>:{" "}
      {present ? "presente" : "ausente"}
      {present && detail ? (
        <span className="text-muted-foreground"> ({detail})</span>
      ) : null}
    </li>
  );
}

function SetupErrorDetails({ diagnostics }: { diagnostics: CoveruEnvDiagnostics }) {
  const anonKind = classifyAnonKeyFromPrefix(
    diagnostics.hasAnonKey ? diagnostics.anonPrefix : "empty",
  );

  const anonDetail = diagnostics.hasAnonKey
    ? `longitud: ${diagnostics.anonLength}, prefijo: ${anonKind}`
    : undefined;

  return (
    <ul className="list-inside list-disc space-y-1 text-sm">
      <EnvVarStatus
        name="NEXT_PUBLIC_SUPABASE_URL"
        present={diagnostics.hasUrl}
        detail={
          diagnostics.hasUrl && diagnostics.urlHost
            ? `host: ${diagnostics.urlHost}`
            : diagnostics.hasUrl
              ? "host: inválido"
              : undefined
        }
      />
      <EnvVarStatus
        name="NEXT_PUBLIC_SUPABASE_ANON_KEY"
        present={diagnostics.hasAnonKey}
        detail={anonDetail}
      />
      <EnvVarStatus
        name="SUPABASE_SERVICE_ROLE_KEY"
        present={diagnostics.hasServiceRole}
      />
    </ul>
  );
}

export function SetupError({
  compact = false,
  className,
  diagnostics,
}: SetupErrorProps) {
  if (compact) {
    return (
      <div
        role="alert"
        className={`rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive ${className ?? ""}`}
      >
        <strong>Configuración incompleta.</strong> Supabase no está configurado
        en este entorno.
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Configuración requerida</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          CoverÜ necesita variables de entorno de Supabase para autenticación y
          datos del catálogo.
        </p>
        {diagnostics ? (
          <SetupErrorDetails diagnostics={diagnostics} />
        ) : (
          <p>
            Configura{" "}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> y{" "}
            <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> según el
            archivo <code className="text-xs">.env.example</code>.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
