export const API_DOCS_PRODUCTION_BASE_URL =
  "https://cover-u-app.vercel.app/api/v1";

export const API_DOCS_RELATIVE_BASE_URL = "/api/v1";

export const API_DOCS_CURL_EXAMPLES = {
  listInsurers: `curl -sS -H "X-API-Key: $API_KEY" \\
  "${API_DOCS_PRODUCTION_BASE_URL}/insurers?page=1&per_page=20"`,

  listTariffs: `curl -sS -H "X-API-Key: $API_KEY" \\
  "${API_DOCS_PRODUCTION_BASE_URL}/tariffs?region=Sierra&age=35&gender=femenino&page=1"`,

  coverageQa: `curl -sS -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_KEY" \\
  -d '{"plan_version_id":"$PLAN_VERSION_ID","question":"¿Está cubierta la hospitalización?"}' \\
  "${API_DOCS_PRODUCTION_BASE_URL}/coverage/qa"`,
} as const;
