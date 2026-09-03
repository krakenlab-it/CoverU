"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function LogoutButton({
  supabaseUrl,
  supabaseAnonKey,
  collapsed,
  onNavigate,
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    onNavigate?.();

    const supabase = createClient({ url: supabaseUrl, anonKey: supabaseAnonKey });
    if (supabase) {
      await supabase.auth.signOut();
    }

    router.push("/login");
    router.refresh();
    setLoading(false);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("mt-2 w-full justify-start", collapsed && "px-2")}
      onClick={handleLogout}
      disabled={loading}
    >
      {collapsed ? (
        <span className="sr-only">Cerrar sesión</span>
      ) : (
        loading ? "Cerrando sesión…" : "Cerrar sesión"
      )}
    </Button>
  );
}
