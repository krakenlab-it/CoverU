"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type BrandAssetImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  fallback: React.ReactNode;
};

export function BrandAssetImage({
  src,
  alt,
  width,
  height,
  className,
  priority,
  fallback,
}: BrandAssetImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn("h-auto w-auto max-w-full", className)}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
