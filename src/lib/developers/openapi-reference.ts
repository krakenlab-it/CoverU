import openapi from "../../../public/openapi.json";

export type ApiEndpoint = {
  method: string;
  path: string;
  fullPath: string;
  summary: string;
  tag: string;
  operationId?: string;
};

type OpenApiPathItem = Record<
  string,
  { summary?: string; tags?: string[]; operationId?: string } | undefined
>;

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
]);

export function listApiEndpoints(
  spec: { paths: Record<string, OpenApiPathItem> } = openapi,
): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method) || !operation) {
        continue;
      }

      endpoints.push({
        method: method.toUpperCase(),
        path,
        fullPath: `/api/v1${path}`,
        summary: operation.summary ?? "Sin descripción",
        tag: operation.tags?.[0] ?? "General",
        operationId: operation.operationId,
      });
    }
  }

  return endpoints.sort((a, b) => {
    const tagCompare = a.tag.localeCompare(b.tag, "es");
    if (tagCompare !== 0) {
      return tagCompare;
    }
    const pathCompare = a.path.localeCompare(b.path);
    if (pathCompare !== 0) {
      return pathCompare;
    }
    return a.method.localeCompare(b.method);
  });
}

export function groupApiEndpointsByTag(
  endpoints: ApiEndpoint[],
): Map<string, ApiEndpoint[]> {
  const groups = new Map<string, ApiEndpoint[]>();

  for (const endpoint of endpoints) {
    const existing = groups.get(endpoint.tag) ?? [];
    existing.push(endpoint);
    groups.set(endpoint.tag, existing);
  }

  return groups;
}
