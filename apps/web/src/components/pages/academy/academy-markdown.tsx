import { Lightbulb } from "lucide-react";
import Link from "next/link";
import ReactMarkdown, { type Components, type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import { AcademyArticleLink } from "./academy-article-link";
import {
  academyUrlTransform,
  parseAcademyHref,
  slugifyHeading,
} from "./academy-links";
import { AcademyModuleButton } from "./academy-module-button";

type HastElement = NonNullable<ExtraProps["node"]>;
type ElementContent = HastElement["children"][number];

function hastText(node: HastElement | ElementContent): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node && node.children) {
    return node.children.map(hastText).join("");
  }
  return "";
}

function moduleLinks(children: ElementContent[]) {
  const meaningful = children.filter(
    (child) => !(child.type === "text" && !child.value.trim()),
  );
  const links = meaningful.flatMap((child) => {
    if (child.type !== "element" || child.tagName !== "a") return [];
    const href = child.properties?.href;
    return typeof href === "string" && href.startsWith("app:")
      ? [{ href: href.slice(4), label: hastText(child) }]
      : [];
  });
  return links.length > 0 && links.length === meaningful.length ? links : null;
}

const components: Components = {
  h2: ({ node, children }) => (
    <h2
      id={slugifyHeading(node ? hastText(node) : "")}
      className="mt-9 mb-3 scroll-mt-4 font-heading text-xl font-semibold tracking-tight first:mt-0"
    >
      {children}
    </h2>
  ),
  h3: ({ node, children }) => (
    <h3
      id={slugifyHeading(node ? hastText(node) : "")}
      className="mt-6 mb-1.5 scroll-mt-4 text-base font-semibold first:mt-0"
    >
      {children}
    </h3>
  ),
  p: ({ node, children }) => {
    const links = node ? moduleLinks(node.children) : null;
    if (links) {
      return (
        <div className="my-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <AcademyModuleButton key={link.href} {...link} />
          ))}
        </div>
      );
    }
    return <p className="my-3 leading-7">{children}</p>;
  },
  a: ({ href, children }) => {
    const target = parseAcademyHref(href ?? "");
    switch (target.kind) {
      case "article":
        return (
          <AcademyArticleLink slug={target.slug} anchor={target.anchor}>
            {children}
          </AcademyArticleLink>
        );
      case "section":
        return (
          <a
            href={`#${target.anchor}`}
            className="font-medium text-info underline decoration-info/40 underline-offset-2 hover:decoration-info"
          >
            {children}
          </a>
        );
      case "module":
        return (
          <Link
            href={target.path}
            className="font-medium text-foreground underline decoration-veo-lime decoration-2 underline-offset-2"
          >
            {children}
          </Link>
        );
      default:
        return (
          <a
            href={target.href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-info underline underline-offset-2"
          >
            {children}
          </a>
        );
    }
  },
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 pl-6 marker:text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-6 marker:font-semibold marker:text-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <aside className="my-4 flex gap-3 rounded-md border border-veo-lime/40 bg-veo-lime/10 px-4 py-3 text-sm [&_p]:my-0">
      <Lightbulb className="mt-1 size-4 shrink-0 text-foreground" />
      <div className="min-w-0 space-y-2">{children}</div>
    </aside>
  ),
  hr: () => <hr className="my-6 border-border" />,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-md bg-muted p-4 text-xs leading-relaxed [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b bg-muted/60 px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b px-3 py-2 align-top [tr:last-child_&]:border-b-0">
      {children}
    </td>
  ),
};

export function AcademyMarkdown({ body }: { body: string }) {
  return (
    <div className="text-[0.9375rem] break-words text-foreground/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        urlTransform={academyUrlTransform}
        skipHtml
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
