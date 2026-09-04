import Image from "next/image";
import Link from "next/link";
import { VISUAL_PACK_MARKETING } from "@/lib/visual-pack/assets";

type AuthPageFooterProps = {
  backHref?: string;
  backLabel?: string;
};

export function AuthPageFooter({
  backHref = "/",
  backLabel = "← Volver al inicio",
}: AuthPageFooterProps) {
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      <Link href={backHref} className="hover:text-primary">
        {backLabel}
      </Link>
    </p>
  );
}

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[60vh] w-full max-w-5xl grid-cols-1 items-stretch gap-8 px-4 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="flex flex-col justify-center">{children}</div>

      <aside
        className="relative hidden min-h-[28rem] overflow-hidden rounded-3xl border border-border bg-[#FCFBF8] shadow-sm md:block"
        aria-label="Presentación CoverÜ Demo"
      >
        <Image
          src={VISUAL_PACK_MARKETING.authHero}
          alt="Entra con tranquilidad — sistema Demo sin precios ni logos de aseguradoras"
          fill
          sizes="(min-width: 768px) 26rem, 100vw"
          className="object-cover object-top"
          priority
        />
      </aside>
    </div>
  );
}
