"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseCompareIds } from "@/lib/marketplace/compare";
import {
  filtersToQueryString,
  parseMarketplaceFilters,
} from "@/lib/marketplace/filters";
import {
  formatResultsRange,
  PAGE_SIZE_OPTIONS,
  type PageSizeOption,
} from "@/lib/marketplace/pagination";
import { cn } from "@/lib/utils";

interface MarketplacePaginationProps {
  totalCount: number;
  page: number;
  pageSize: PageSizeOption;
  startIndex: number;
  endIndex: number;
  totalPages: number;
}

function getVisiblePages(page: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, page]);
  for (let offset = -1; offset <= 1; offset += 1) {
    const candidate = page + offset;
    if (candidate >= 1 && candidate <= totalPages) pages.add(candidate);
  }

  return [...pages].sort((a, b) => a - b);
}

export function MarketplacePagination({
  totalCount,
  page,
  pageSize,
  startIndex,
  endIndex,
  totalPages,
}: MarketplacePaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = parseMarketplaceFilters(searchParams);
  const compareIds = parseCompareIds(searchParams.get("compare"));

  const navigate = (next: Partial<{ page: number; pageSize: PageSizeOption }>) => {
    const merged = { ...filters, ...next };
    const qs = filtersToQueryString(merged, compareIds);
    startTransition(() => {
      router.push(`/app/marketplace${qs}`);
    });
  };

  if (totalCount === 0) return null;

  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <nav
      aria-label="Paginación de resultados"
      className={cn(
        "flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between",
        isPending && "opacity-70",
      )}
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {formatResultsRange(startIndex, endIndex, totalCount)}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="marketplace-page-size" className="text-sm text-muted-foreground">
            Por página
          </label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              navigate({ page: 1, pageSize: Number(value) as PageSizeOption })
            }
          >
            <SelectTrigger
              id="marketplace-page-size"
              size="sm"
              className="w-[72px]"
              aria-label="Resultados por página"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="Navegación de páginas">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-lg"
            onClick={() => navigate({ page: 1 })}
            disabled={page <= 1}
            aria-label="Primera página"
          >
            <ChevronsLeftIcon aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-lg"
            onClick={() => navigate({ page: page - 1 })}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeftIcon aria-hidden="true" />
          </Button>

          {visiblePages.map((pageNumber, index) => {
            const previous = visiblePages[index - 1];
            const showEllipsis = previous != null && pageNumber - previous > 1;

            return (
              <span key={pageNumber} className="flex items-center gap-1">
                {showEllipsis ? (
                  <span className="px-1 text-sm text-muted-foreground" aria-hidden="true">
                    …
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant={pageNumber === page ? "brand" : "outline"}
                  size="icon-sm"
                  className="min-w-8 rounded-lg"
                  onClick={() => navigate({ page: pageNumber })}
                  aria-label={`Página ${pageNumber}`}
                  aria-current={pageNumber === page ? "page" : undefined}
                >
                  {pageNumber}
                </Button>
              </span>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-lg"
            onClick={() => navigate({ page: page + 1 })}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
          >
            <ChevronRightIcon aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-lg"
            onClick={() => navigate({ page: totalPages })}
            disabled={page >= totalPages}
            aria-label="Última página"
          >
            <ChevronsRightIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
