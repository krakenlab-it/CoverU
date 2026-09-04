"use client";

import { useState } from "react";
import { MarketplaceFiltersPanel } from "@/components/marketplace/MarketplaceFiltersPanel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { countActiveFilters } from "@/lib/marketplace/active-filters";
import { parseMarketplaceFilters } from "@/lib/marketplace/filters";
import type { Insurer } from "@/lib/types/database";
import { SlidersHorizontalIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface MarketplaceMobileFiltersProps {
  insurers: Insurer[];
  compareIds?: string[];
}

export function MarketplaceMobileFilters({
  insurers,
  compareIds = [],
}: MarketplaceMobileFiltersProps) {
  const searchParams = useSearchParams();
  const filters = parseMarketplaceFilters(searchParams);
  const activeFilterCount = countActiveFilters(filters);
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full lg:hidden"
        >
          <SlidersHorizontalIcon aria-hidden="true" />
          Filtros
          {activeFilterCount > 0 ? (
            <Badge variant="default" className="ml-1">
              {activeFilterCount}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Filtros del marketplace</SheetTitle>
          <SheetDescription>
            Ajusta criterios de búsqueda y perfil del asegurado.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <MarketplaceFiltersPanel
            insurers={insurers}
            compareIds={compareIds}
            onApplied={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
