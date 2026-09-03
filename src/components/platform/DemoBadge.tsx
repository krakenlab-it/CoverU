import { Badge } from "@/components/ui/badge";
import { DEMO_BADGE_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type DemoBadgeProps = {
  className?: string;
  label?: string;
};

export function DemoBadge({
  className,
  label = DEMO_BADGE_LABEL,
}: DemoBadgeProps) {
  return (
    <Badge
      variant="outline"
      title={label}
      className={cn(
        "border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-100",
        className,
      )}
    >
      DEMO
    </Badge>
  );
}
