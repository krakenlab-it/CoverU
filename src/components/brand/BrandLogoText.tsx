import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BrandLogoTextProps = {
  className?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
} as const;

/** Text fallback when Sam's wordmark assets are not yet in `public/`. */
export function BrandLogoText({
  className,
  subtitle,
  size = "md",
}: BrandLogoTextProps) {
  return (
    <span className={cn("inline-flex flex-col leading-tight", className)}>
      <span
        className={cn("font-bold tracking-tight text-primary", sizeClasses[size])}
        aria-label={SITE_NAME}
      >
        Cover<span className="underline decoration-2 underline-offset-4">Ü</span>
      </span>
      {subtitle ? (
        <span className="text-sm font-medium text-muted-foreground">{subtitle}</span>
      ) : null}
    </span>
  );
}
