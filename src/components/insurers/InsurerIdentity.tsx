import Image from "next/image";
import { formatCatalogDisplayName } from "@/lib/marketplace/display";
import { cn } from "@/lib/utils";

type InsurerIdentitySize = "sm" | "md";

const SIZE_STYLES: Record<
  InsurerIdentitySize,
  { logo: string; text: string; image: number }
> = {
  sm: {
    logo: "h-5 w-auto max-w-[72px] object-contain",
    text: "text-sm",
    image: 20,
  },
  md: {
    logo: "h-7 w-auto max-w-[96px] object-contain",
    text: "text-sm",
    image: 28,
  },
};

export interface InsurerIdentityProps {
  name: string;
  logoUrl?: string | null;
  size?: InsurerIdentitySize;
  className?: string;
  nameClassName?: string;
}

/**
 * Renders insurer logo together with the carrier name.
 * Never show the logo without the adjacent name label.
 */
export function InsurerIdentity({
  name,
  logoUrl,
  size = "md",
  className,
  nameClassName,
}: InsurerIdentityProps) {
  const displayName = formatCatalogDisplayName(name);
  const styles = SIZE_STYLES[size];

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          aria-hidden
          width={styles.image * 3}
          height={styles.image}
          className={styles.logo}
          unoptimized={logoUrl.endsWith(".svg")}
        />
      ) : null}
      <span className={cn("font-medium text-muted-foreground", styles.text, nameClassName)}>
        {displayName}
      </span>
    </div>
  );
}
