import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PublicAuthNav } from "@/lib/auth/public-nav";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";

type HeaderAuthControlProps = {
  authNav: PublicAuthNav;
  className?: string;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function HeaderAuthControl({
  authNav,
  className,
  variant = "desktop",
  onNavigate,
}: HeaderAuthControlProps) {
  if (variant === "mobile") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Link
          href={authNav.href}
          onClick={onNavigate}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
            motion.navLink,
            authNav.isLoggedIn
              ? "text-primary"
              : "bg-primary/10 text-primary",
          )}
        >
          {authNav.label}
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={authNav.isLoggedIn ? "ghost" : "outline"}
        size="sm"
        asChild
        className={cn(!authNav.isLoggedIn && "rounded-full")}
      >
        <Link href={authNav.href} className={motion.navLink}>
          {authNav.label}
        </Link>
      </Button>
    </div>
  );
}
