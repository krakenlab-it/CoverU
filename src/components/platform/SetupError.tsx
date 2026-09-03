import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SetupErrorProps = {
  compact?: boolean;
  className?: string;
};

export function SetupError({ compact = false, className }: SetupErrorProps) {
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
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          CoverÜ necesita variables de entorno de Supabase para autenticación y
          datos del catálogo.
        </p>
        <p>
          Configura <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> y{" "}
          <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> según el
          archivo <code className="text-xs">.env.example</code>.
        </p>
      </CardContent>
    </Card>
  );
}
