import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  subtitle?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
} as const;

export function BrandLogo({
  className,
  subtitle,
  href = "/",
  size = "md",
}: BrandLogoProps) {
  const content = (
    <>
      <span className={cn("font-bold tracking-tight text-primary", sizeClasses[size])}>
        Cover<span className="underline decoration-2 underline-offset-4">Ü</span>
      </span>
      {subtitle ? (
        <span className="text-sm font-medium text-muted-foreground">{subtitle}</span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("inline-flex flex-col leading-tight", className)}
        aria-label={`${SITE_NAME} — inicio`}
      >
        {content}
      </Link>
    );
  }

  return <div className={cn("inline-flex flex-col leading-tight", className)}>{content}</div>;
}
