"use client";

import type { StateIllustrationVariant } from "@/lib/brand/assets";
import { stateIllustrationSrc } from "@/lib/brand/assets";
import { BrandAssetImage } from "@/components/brand/BrandAssetImage";
import { cn } from "@/lib/utils";

type StateIllustrationProps = {
  variant: StateIllustrationVariant;
  className?: string;
};

const ILLUSTRATION_DIMS: Record<
  StateIllustrationVariant,
  { width: number; height: number; label: string }
> = {
  empty: { width: 200, height: 160, label: "Sin resultados" },
  error: { width: 200, height: 160, label: "Error al cargar" },
  loading: { width: 200, height: 160, label: "Cargando" },
};

export function StateIllustration({ variant, className }: StateIllustrationProps) {
  const dims = ILLUSTRATION_DIMS[variant];
  const src = stateIllustrationSrc(variant);

  return (
    <BrandAssetImage
      src={src}
      alt=""
      width={dims.width}
      height={dims.height}
      className={cn("mx-auto opacity-90", className)}
      fallback={null}
    />
  );
}
