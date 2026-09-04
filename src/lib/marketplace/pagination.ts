export const DEFAULT_PAGE_SIZE = 12;

export const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export interface PaginatedSlice<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: PageSizeOption;
  startIndex: number;
  endIndex: number;
  totalPages: number;
}

export function normalizePage(page?: number): number {
  if (page == null || Number.isNaN(page) || page < 1) return 1;
  return Math.floor(page);
}

export function normalizePageSize(pageSize?: number): PageSizeOption {
  if (
    pageSize != null &&
    PAGE_SIZE_OPTIONS.includes(pageSize as PageSizeOption)
  ) {
    return pageSize as PageSizeOption;
  }
  return DEFAULT_PAGE_SIZE;
}

export function paginateArray<T>(
  items: T[],
  page?: number,
  pageSize?: number,
): PaginatedSlice<T> {
  const normalizedPageSize = normalizePageSize(pageSize);
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / normalizedPageSize));
  const normalizedPage = Math.min(normalizePage(page), totalPages);
  const startIndex = (normalizedPage - 1) * normalizedPageSize;
  const endIndex = Math.min(startIndex + normalizedPageSize, totalCount);

  return {
    items: items.slice(startIndex, endIndex),
    totalCount,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    startIndex,
    endIndex,
    totalPages,
  };
}

export function formatResultsRange(
  startIndex: number,
  endIndex: number,
  totalCount: number,
): string {
  if (totalCount === 0) return "Mostrando 0 de 0";
  return `Mostrando ${startIndex + 1}–${endIndex} de ${totalCount}`;
}
