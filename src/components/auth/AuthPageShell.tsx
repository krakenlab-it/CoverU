import Link from "next/link";

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
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      {children}
    </div>
  );
}
