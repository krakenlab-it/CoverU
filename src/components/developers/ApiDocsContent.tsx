import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  API_DOCS_CURL_EXAMPLES,
  API_DOCS_PRODUCTION_BASE_URL,
  API_DOCS_RELATIVE_BASE_URL,
} from "@/lib/developers/api-docs";
import {
  groupApiEndpointsByTag,
  listApiEndpoints,
} from "@/lib/developers/openapi-reference";
import { CodeBlock } from "./CodeBlock";

const METHOD_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  GET: "secondary",
  POST: "default",
  PUT: "outline",
  PATCH: "outline",
  DELETE: "destructive",
};

export function ApiDocsContent() {
  const endpoints = listApiEndpoints();
  const endpointsByTag = groupApiEndpointsByTag(endpoints);

  return (
    <div className="space-y-8">
      <section aria-labelledby="api-docs-auth-heading" className="space-y-3">
        <h2 id="api-docs-auth-heading" className="text-lg font-semibold">
          Autenticación
        </h2>
        <p className="text-sm text-muted-foreground">
          Todas las solicitudes requieren una clave API de tu organización.
          Envíala en el header{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">X-API-Key</code>{" "}
          o como{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            Authorization: Bearer &lt;clave&gt;
          </code>
          . Las claves se almacenan como hash y no se vuelven a mostrar después
          de crearlas.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/desarrolladores/api-keys">Crear o administrar claves</Link>
        </Button>
      </section>

      <section aria-labelledby="api-docs-base-url-heading" className="space-y-3">
        <h2 id="api-docs-base-url-heading" className="text-lg font-semibold">
          URL base
        </h2>
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <p>
              <span className="font-medium">Producción:</span>{" "}
              <code className="break-all">{API_DOCS_PRODUCTION_BASE_URL}</code>
            </p>
            <p className="text-muted-foreground">
              En el mismo despliegue también puedes usar la ruta relativa{" "}
              <code>{API_DOCS_RELATIVE_BASE_URL}</code>.
            </p>
          </CardContent>
        </Card>
      </section>

      <section
        aria-labelledby="api-docs-endpoints-heading"
        className="space-y-4"
      >
        <h2 id="api-docs-endpoints-heading" className="text-lg font-semibold">
          Referencia de endpoints
        </h2>
        <p className="text-sm text-muted-foreground">
          {endpoints.length} operaciones disponibles en la API B2B v1.
        </p>
        <div className="space-y-6">
          {[...endpointsByTag.entries()].map(([tag, tagEndpoints]) => (
            <div key={tag} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {tag}
              </h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <caption className="sr-only">
                    Endpoints del grupo {tag}
                  </caption>
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th scope="col" className="px-4 py-2 font-medium">
                        Método
                      </th>
                      <th scope="col" className="px-4 py-2 font-medium">
                        Ruta
                      </th>
                      <th scope="col" className="px-4 py-2 font-medium">
                        Descripción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tagEndpoints.map((endpoint) => (
                      <tr
                        key={`${endpoint.method}-${endpoint.path}`}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-4 py-3 align-top">
                          <Badge
                            variant={
                              METHOD_VARIANT[endpoint.method] ?? "outline"
                            }
                          >
                            {endpoint.method}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-top font-mono text-xs">
                          {endpoint.fullPath}
                        </td>
                        <td className="px-4 py-3 align-top text-muted-foreground">
                          {endpoint.summary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="api-docs-examples-heading"
        className="space-y-4"
      >
        <h2 id="api-docs-examples-heading" className="text-lg font-semibold">
          Ejemplos con curl
        </h2>
        <p className="text-sm text-muted-foreground">
          Reemplaza <code>$API_KEY</code> por tu clave y{" "}
          <code>$PLAN_VERSION_ID</code> por un UUID de versión de plan válido.
        </p>
        <CodeBlock title="Listar aseguradoras">
          {API_DOCS_CURL_EXAMPLES.listInsurers}
        </CodeBlock>
        <CodeBlock title="Buscar tarifas">
          {API_DOCS_CURL_EXAMPLES.listTariffs}
        </CodeBlock>
        <CodeBlock title="Consulta de cobertura (QA)">
          {API_DOCS_CURL_EXAMPLES.coverageQa}
        </CodeBlock>
      </section>

      <section
        aria-labelledby="api-docs-rate-limits-heading"
        className="space-y-3"
      >
        <h2 id="api-docs-rate-limits-heading" className="text-lg font-semibold">
          Límites de tasa
        </h2>
        <p className="text-sm text-muted-foreground">
          Por defecto cada clave API permite 100 solicitudes por minuto. Las
          respuestas incluyen los headers{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            X-RateLimit-Limit
          </code>{" "}
          y{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            X-RateLimit-Remaining
          </code>
          . Revisa el uso en{" "}
          <Link
            href="/app/desarrolladores/uso"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Uso
          </Link>{" "}
          y ajusta los límites en{" "}
          <Link
            href="/app/configuracion/limites"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Configuración → Límites de tasa
          </Link>
          .
        </p>
      </section>

      <section
        aria-labelledby="api-docs-errors-heading"
        className="space-y-3"
      >
        <h2 id="api-docs-errors-heading" className="text-lg font-semibold">
          Errores
        </h2>
        <p className="text-sm text-muted-foreground">
          Las respuestas de error usan un envelope con{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            error.code
          </code>
          ,{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            error.message
          </code>{" "}
          y{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            request_id
          </code>
          .
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            <code>401 missing_api_key</code> — Sin credenciales
          </li>
          <li>
            <code>401 invalid_api_key</code> — Clave inválida o revocada
          </li>
          <li>
            <code>403 insufficient_scope</code> — Scope insuficiente
          </li>
          <li>
            <code>429 rate_limit_exceeded</code> — Límite excedido
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="api-docs-openapi-heading"
        className="space-y-3"
      >
        <h2 id="api-docs-openapi-heading" className="text-lg font-semibold">
          Especificación OpenAPI
        </h2>
        <p className="text-sm text-muted-foreground">
          Descarga la especificación completa en formato OpenAPI 3.1 para
          generar clientes o importar en Postman.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/openapi.json" download>
              Descargar openapi.json
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="/openapi.json" target="_blank" rel="noopener noreferrer">
              Abrir OpenAPI
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
