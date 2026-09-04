import { NextResponse } from "next/server";
import {
  authenticateApiKey,
  requireScope,
  type ApiAuthFailure,
} from "@/lib/api/auth";
import {
  logApiUsage,
  type UsageLogMetadata,
} from "@/lib/api/usage-log";
import { getRateLimiter } from "@/lib/api/rate-limit";
import {
  apiError,
  apiSuccess,
  generateRequestId,
  REQUEST_ID_HEADER,
} from "@/lib/api/response";
import { createLogger } from "@/lib/logging/logger";
import type { ApiAuthContext } from "@/lib/types/phase1";

const apiLogger = createLogger("api.v1");

export interface ApiHandlerContext {
  request: Request;
  requestId: string;
  auth: ApiAuthContext;
  searchParams: URLSearchParams;
  usageMetadata?: UsageLogMetadata;
}

type ApiHandler = (
  ctx: ApiHandlerContext,
) => Promise<NextResponse> | NextResponse;

interface ApiRouteOptions {
  requiredScope?: string;
}

export function withApiV1(
  handler: ApiHandler,
  options: ApiRouteOptions = {},
): (request: Request) => Promise<NextResponse> {
  return async (request: Request) => {
    const start = Date.now();
    const requestId =
      request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();

    const authResult = await authenticateApiKey(request);
    if (!authResult.ok) {
      const failure = authResult as ApiAuthFailure;
      return apiError(
        requestId,
        failure.status,
        failure.code,
        failure.message,
      );
    }

    const rateLimit = await getRateLimiter().check(
      `api:${authResult.context.apiKeyId}`,
    );

    if (!rateLimit.allowed) {
      return apiError(
        requestId,
        429,
        "rate_limit_exceeded",
        "Límite de solicitudes excedido. Intenta más tarde.",
        {
          limit: rateLimit.limit,
          reset_at: new Date(rateLimit.resetAt).toISOString(),
        },
      );
    }

    if (options.requiredScope) {
      const scopeError = requireScope(
        authResult.context,
        options.requiredScope,
      );
      if (scopeError) {
        await logApiUsage(
          authResult.context,
          requestId,
          request,
          scopeError.status,
          Date.now() - start,
          undefined,
        );
        return apiError(
          requestId,
          scopeError.status,
          scopeError.code,
          scopeError.message,
        );
      }
    }

    const url = new URL(request.url);
    const handlerContext: ApiHandlerContext = {
      request,
      requestId,
      auth: authResult.context,
      searchParams: url.searchParams,
    };
    let response: NextResponse;

    try {
      response = await handler(handlerContext);
    } catch (err) {
      apiLogger.error(
        "API v1 handler error",
        { error: err instanceof Error ? err.message : "unknown" },
        requestId,
      );
      response = apiError(
        requestId,
        500,
        "internal_error",
        "Error interno del servidor",
      );
    }

    await logApiUsage(
      authResult.context,
      requestId,
      request,
      response.status,
      Date.now() - start,
      handlerContext.usageMetadata,
    );

    response.headers.set(REQUEST_ID_HEADER, requestId);
    response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));

    return response;
  };
}

export { apiError, apiSuccess };
