type CodeBlockProps = {
  children: string;
  title?: string;
};

export function CodeBlock({ children, title }: CodeBlockProps) {
  return (
    <figure className="space-y-2">
      {title ? (
        <figcaption className="text-sm font-medium">{title}</figcaption>
      ) : null}
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted/60 p-4 text-sm leading-relaxed">
        <code>{children}</code>
      </pre>
    </figure>
  );
}
