import { StateIllustration } from "@/components/brand/StateIllustration";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
  showIllustration?: boolean;
};

export function LoadingState({
  label = "Cargando…",
  className,
  showIllustration = true,
}: LoadingStateProps) {
  return (
    <div
      className={cn("space-y-4", className)}
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      {showIllustration ? (
        <div aria-hidden="true">
          <StateIllustration variant="loading" />
        </div>
      ) : null}
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
