import Link from "next/link";
import { BrandAssetImage } from "@/components/brand/BrandAssetImage";
import { BrandLogoText } from "@/components/brand/BrandLogoText";
import { brandLogoSrc, type BrandLogoVariant } from "@/lib/brand/assets";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  subtitle?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
};

const LOGO_VARIANT: Record<NonNullable<BrandLogoProps["size"]>, BrandLogoVariant> = {
  sm: "mark",
  md: "wordmark",
  lg: "lockup-horizontal",
};

const LOGO_DIMS: Record<NonNullable<BrandLogoProps["size"]>, { width: number; height: number }> = {
  sm: { width: 32, height: 32 },
  md: { width: 140, height: 36 },
  lg: { width: 200, height: 48 },
};

export function BrandLogo({
  className,
  subtitle,
  href = "/",
  size = "md",
}: BrandLogoProps) {
  const variant = LOGO_VARIANT[size];
  const dims = LOGO_DIMS[size];
  const src = brandLogoSrc(variant);

  const content = (
    <>
      <BrandAssetImage
        src={src}
        alt={SITE_NAME}
        width={dims.width}
        height={dims.height}
        priority={size === "lg"}
        className={size === "sm" ? "size-8" : undefined}
        fallback={<BrandLogoText size={size} />}
      />
      {subtitle ? (
        <span className="text-sm font-medium text-muted-foreground">{subtitle}</span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("inline-flex flex-col gap-0.5 leading-tight", className)}
        aria-label={`${SITE_NAME} — inicio`}
      >
        {content}
      </Link>
    );
  }

  return <div className={cn("inline-flex flex-col gap-0.5 leading-tight", className)}>{content}</div>;
}
