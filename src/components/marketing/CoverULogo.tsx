import Image from "next/image";
import Link from "next/link";
import { MARKETING_ASSETS } from "@/lib/marketing-assets";

type CoverULogoProps = {
  className?: string;
  priority?: boolean;
};

export function CoverULogo({ className = "", priority = false }: CoverULogoProps) {
  return (
    <Image
      src={MARKETING_ASSETS.logotipo}
      alt="Cover U"
      width={660}
      height={204}
      priority={priority}
      className={`h-8 w-auto sm:h-9 md:max-h-14 ${className}`}
    />
  );
}

type CoverULogoLinkProps = {
  className?: string;
  priority?: boolean;
};

export function CoverULogoLink({ className = "", priority = false }: CoverULogoLinkProps) {
  return (
    <Link href="/" className={`inline-flex shrink-0 ${className}`} aria-label="Cover U — inicio">
      <CoverULogo priority={priority} />
    </Link>
  );
}
