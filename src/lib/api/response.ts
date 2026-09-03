import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const REQUEST_ID_HEADER = "x-request-id";

export function generateRequestId(): string {
  return randomUUID();
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  request_id: string;
}

export function apiError(
  requestId: string,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    error: { code, message, ...(details !== undefined ? { details } : {}) },
    request_id: requestId,
  };
  return NextResponse.json(body, {
    status,
    headers: { [REQUEST_ID_HEADER]: requestId },
  });
}

export function apiSuccess<T>(
  requestId: string,
  data: T,
  init?: { status?: number; headers?: Record<string, string> },
): NextResponse {
  return NextResponse.json(
    { data, request_id: requestId },
    {
      status: init?.status ?? 200,
      headers: {
        [REQUEST_ID_HEADER]: requestId,
        ...init?.headers,
      },
    },
  );
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export function paginate<T>(
  items: T[],
  page: number,
  perPage: number,
): { items: T[]; meta: PaginationMeta } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  const end = start + perPage;

  return {
    items: items.slice(start, end),
    meta: {
      page: safePage,
      per_page: perPage,
      total,
      total_pages: totalPages,
    },
  };
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
): { page: number; perPage: number } {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const perPage = Math.min(
    100,
    Math.max(1, Number(searchParams.get("per_page") ?? "20") || 20),
  );
  return { page, perPage };
}
