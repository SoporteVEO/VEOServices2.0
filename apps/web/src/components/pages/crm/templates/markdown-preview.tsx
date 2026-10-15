import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-5 mb-2 font-heading text-2xl font-semibold tracking-tight first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-2 font-heading text-xl font-semibold first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-1.5 text-base font-semibold first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="my-2.5 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="my-2.5 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => (
    <ol className="my-2.5 list-decimal space-y-1 pl-6">{children}</ol>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-info underline underline-offset-2"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-veo-lime pl-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-border" />,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-md bg-muted p-3 text-xs [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b bg-muted/60 px-3 py-1.5 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b px-3 py-1.5">{children}</td>,
  img: ({ src, alt }) =>
    typeof src === "string" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt ?? ""} className="my-3 max-w-full" />
    ) : null,
};

export function MarkdownPreview({
  markdown,
  className,
  emptyMessage = "La vista previa aparecerá aquí.",
}: {
  markdown: string;
  className?: string;
  emptyMessage?: string;
}) {
  if (!markdown.trim()) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>{emptyMessage}</p>
    );
  }
  return (
    <div className={cn("text-sm break-words text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        skipHtml
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
