import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  as?: "h2" | "h3";
};

export function SectionHeader({
  title,
  description,
  className,
  as: Tag = "h2",
}: SectionHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <Tag className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        {title}
      </Tag>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
