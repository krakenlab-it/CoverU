import { generateApiKey } from "@/lib/api/api-key";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/settings/session";
import type { ApiKeyRecord } from "@/lib/types/phase1";

export interface ApiKeyListItem {
  id: string;
  name: string;
  keyPrefix: string;
  status: "active" | "revoked" | "expired";
  lastUsedAt: string | null;
  createdAt: string;
  clientName: string;
  scopes: string[];
}

export interface ApiKeyListResult {
  keys: ApiKeyListItem[];
  serviceConfigured: boolean;
}

export interface CreateApiKeyResult {
  key: ApiKeyListItem;
  rawKey: string;
}

function toListItem(
  key: Pick<
    ApiKeyRecord,
    "id" | "name" | "key_prefix" | "status" | "last_used_at" | "created_at" | "scopes"
  >,
  clientName: string,
): ApiKeyListItem {
  return {
    id: key.id,
    name: key.name,
    keyPrefix: `${key.key_prefix}…`,
    status: key.status,
    lastUsedAt: key.last_used_at,
    createdAt: key.created_at,
    clientName,
    scopes: key.scopes ?? [],
  };
}

export async function listOrgApiKeys(
  organizationId: string,
): Promise<ApiKeyListResult> {
  if (!hasServiceRole()) {
    return { keys: [], serviceConfigured: false };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { keys: [], serviceConfigured: false };
  }

  const { data: clients, error: clientsError } = await admin
    .from("api_clients")
    .select("id, name")
    .eq("organization_id", organizationId);

  if (clientsError || !clients?.length) {
    return { keys: [], serviceConfigured: true };
  }

  const clientIds = clients.map((client) => client.id);
  const clientNameById = new Map(
    clients.map((client) => [client.id, client.name]),
  );

  const { data: keys, error: keysError } = await admin
    .from("api_keys")
    .select(
      "id, api_client_id, name, key_prefix, status, last_used_at, created_at, scopes",
    )
    .in("api_client_id", clientIds)
    .order("created_at", { ascending: false });

  if (keysError || !keys) {
    return { keys: [], serviceConfigured: true };
  }

  return {
    keys: keys.map((key) =>
      toListItem(
        key,
        clientNameById.get(key.api_client_id) ?? "Cliente API",
      ),
    ),
    serviceConfigured: true,
  };
}

async function ensureApiClient(organizationId: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: existing } = await admin
    .from("api_clients")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await admin
    .from("api_clients")
    .insert({
      organization_id: organizationId,
      name: "Cliente API",
      description: "Cliente API creado desde el panel de configuración.",
      status: "active",
      is_demo: false,
    })
    .select("id")
    .single();

  if (error || !created) return null;
  return created.id;
}

export async function createOrgApiKey(
  organizationId: string,
  name: string,
): Promise<CreateApiKeyResult | { error: string }> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { error: "El nombre de la clave es obligatorio." };
  }

  if (!hasServiceRole()) {
    return {
      error:
        "No se pueden crear claves API: Supabase no está configurado en este entorno.",
    };
  }

  const clientId = await ensureApiClient(organizationId);
  if (!clientId) {
    return { error: "No se pudo crear el cliente API." };
  }

  const { rawKey, prefix, hash } = generateApiKey();
  const admin = createAdminClient();
  if (!admin) {
    return { error: "Servicio no disponible." };
  }

  const { data, error } = await admin
    .from("api_keys")
    .insert({
      api_client_id: clientId,
      name: trimmedName,
      key_prefix: prefix,
      key_hash: hash,
      status: "active",
      scopes: ["read:catalog", "read:quotes", "read:coverage"],
    })
    .select(
      "id, name, key_prefix, status, last_used_at, created_at, api_client_id, scopes",
    )
    .single();

  if (error || !data) {
    return { error: "No se pudo crear la clave API." };
  }

  return {
    key: toListItem(data, "Cliente API"),
    rawKey,
  };
}

export async function revokeOrgApiKey(
  organizationId: string,
  keyId: string,
): Promise<{ ok: true } | { error: string }> {
  if (!hasServiceRole()) {
    return {
      error:
        "No se pueden revocar claves API: Supabase no está configurado en este entorno.",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { error: "Servicio no disponible." };
  }

  const { data: clients } = await admin
    .from("api_clients")
    .select("id")
    .eq("organization_id", organizationId);

  const clientIds = clients?.map((client) => client.id) ?? [];
  if (clientIds.length === 0) {
    return { error: "Clave no encontrada." };
  }

  const { data: key, error: fetchError } = await admin
    .from("api_keys")
    .select("id, api_client_id, status")
    .eq("id", keyId)
    .maybeSingle();

  if (fetchError || !key || !clientIds.includes(key.api_client_id)) {
    return { error: "Clave no encontrada." };
  }

  if (key.status === "revoked") {
    return { ok: true };
  }

  const { error } = await admin
    .from("api_keys")
    .update({ status: "revoked" })
    .eq("id", keyId);

  if (error) {
    return { error: "No se pudo revocar la clave." };
  }

  return { ok: true };
}
