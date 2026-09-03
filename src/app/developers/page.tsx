import Link from "next/link";
import openapi from "../../../public/openapi.json";
import { PageContainer } from "@/components/platform/PageContainer";
import { PageHeader } from "@/components/platform/PageHeader";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata = buildPublicMetadata({
  title: "Desarrolladores",
  description: "Documentación de la API B2B de CoverÜ para integradores en Ecuador.",
  path: "/developers",
});

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-gray-100">
      <code>{children}</code>
    </pre>
  );
}

export default function DevelopersPage() {
  const paths = Object.keys(openapi.paths);

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="API B2B v1"
        title="Documentación para desarrolladores"
        description="Integra el catálogo de seguros de salud, cotizaciones y consultas de cobertura fundamentadas. Todos los datos de demostración están marcados como [DEMO]."
      />

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Autenticación</h2>
        <p className="mt-2 text-sm text-coveru-gray">
          Envía tu clave API en el header <code>X-API-Key</code> o como{" "}
          <code>Authorization: Bearer &lt;clave&gt;</code>. Las claves se
          almacenan como hash — nunca se expone la clave completa después de la
          creación.
        </p>
        <CodeBlock>{`curl -H "X-API-Key: cov_demo_test_key_phase1_only" \\
  "https://tu-dominio.com/api/v1/insurers"`}</CodeBlock>
        <p className="mt-2 text-xs text-amber-700">
          La clave de demo anterior es solo para entornos locales. No usar en
          producción.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Endpoints</h2>
        <div className="mt-4 space-y-3">
          {paths.map((path) => {
            const methods = Object.keys(
              openapi.paths[path as keyof typeof openapi.paths],
            );
            return methods.map((method) => (
              <div
                key={`${method}-${path}`}
                className="rounded-xl border border-coveru-border p-4"
              >
                <p className="font-mono text-sm">
                  <span className="mr-2 rounded bg-coveru-light px-2 py-0.5 font-semibold uppercase">
                    {method}
                  </span>
                  /api/v1{path}
                </p>
              </div>
            ));
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Ejemplos</h2>
        <h3 className="mt-4 font-medium">Listar planes</h3>
        <CodeBlock>{`curl -H "X-API-Key: cov_demo_test_key_phase1_only" \\
  "https://tu-dominio.com/api/v1/plans?status=active&page=1"`}</CodeBlock>

        <h3 className="mt-6 font-medium">Detalle de versión de plan</h3>
        <CodeBlock>{`curl -H "X-API-Key: cov_demo_test_key_phase1_only" \\
  "https://tu-dominio.com/api/v1/plan-versions?id=d1000000-0000-4000-8000-000000000001"`}</CodeBlock>

        <h3 className="mt-6 font-medium">Pregunta de cobertura</h3>
        <CodeBlock>{`curl -X POST -H "Content-Type: application/json" \\
  -H "X-API-Key: cov_demo_test_key_phase1_only" \\
  -d '{"plan_version_id":"d1000000-0000-4000-8000-000000000001","question":"¿Está cubierta la hospitalización?"}' \\
  "https://tu-dominio.com/api/v1/coverage/qa"`}</CodeBlock>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Errores</h2>
        <p className="mt-2 text-sm text-coveru-gray">
          Todas las respuestas de error incluyen un envelope con{" "}
          <code>error.code</code>, <code>error.message</code> y{" "}
          <code>request_id</code> para auditoría.
        </p>
        <ul className="mt-3 list-inside list-disc text-sm text-coveru-gray">
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

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Límites de tasa</h2>
        <p className="mt-2 text-sm text-coveru-gray">
          Por defecto: 100 solicitudes por minuto por clave API. Headers de
          respuesta: <code>X-RateLimit-Limit</code>,{" "}
          <code>X-RateLimit-Remaining</code>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">OpenAPI 3.1</h2>
        <p className="mt-2 text-sm text-coveru-gray">
          Especificación completa disponible en{" "}
          <Link href="/openapi.json" className="text-coveru-red hover:underline">
            /openapi.json
          </Link>
          .
        </p>
      </section>

      <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <strong>Política de redacción:</strong> Las respuestas de cobertura
        incluyen <code>policy_wording_controls: true</code>. El texto oficial de
        la póliza prevalece sobre cualquier resumen generado.
      </section>
    </PageContainer>
  );
}
