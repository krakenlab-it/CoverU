import { StateIllustration } from "@/components/brand/StateIllustration";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  icon?: React.ReactNode;
  showIllustration?: boolean;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
  icon,
  showIllustration = true,
}: EmptyStateProps) {
  return (
    <Card
      role="status"
      className={cn("border-dashed text-center", className)}
    >
      <CardHeader className="items-center">
        {icon ? (
          <div
            className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            {icon}
          </div>
        ) : showIllustration ? (
          <div className="mb-2" aria-hidden="true">
            <StateIllustration variant="empty" />
          </div>
        ) : null}
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {actionLabel && (onAction || actionHref) ? (
        <CardContent className="flex justify-center pb-6">
          {actionHref ? (
            <Button variant="outline" asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}
