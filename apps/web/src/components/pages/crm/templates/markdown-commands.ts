export interface EditorState {
  value: string;
  start: number;
  end: number;
}

export type MarkdownCommand = (state: EditorState) => EditorState;

export function wrapSelection(
  before: string,
  after: string = before,
  placeholder = "texto",
): MarkdownCommand {
  return ({ value, start, end }) => {
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    return {
      value: next,
      start: start + before.length,
      end: start + before.length + selected.length,
    };
  };
}

function lineBounds(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = value.indexOf("\n", end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  return { lineStart, lineEnd };
}

/** Toggles a prefix on every selected line; `numbered` renders 1. 2. 3. */
export function prefixLines(prefix: string, numbered = false): MarkdownCommand {
  return ({ value, start, end }) => {
    const { lineStart, lineEnd } = lineBounds(value, start, end);
    const lines = value.slice(lineStart, lineEnd).split("\n");
    const pattern = numbered ? /^\d+\.\s/ : new RegExp(`^${escapeRegExp(prefix)}`);
    const allPrefixed = lines.every((line) => pattern.test(line));
    const updated = lines
      .map((line, index) => {
        if (allPrefixed) return line.replace(pattern, "");
        const clean = line.replace(/^(#{1,6}\s|>\s|[-*]\s|\d+\.\s)/, "");
        return `${numbered ? `${index + 1}. ` : prefix}${clean}`;
      })
      .join("\n");
    const next = value.slice(0, lineStart) + updated + value.slice(lineEnd);
    return { value: next, start: lineStart, end: lineStart + updated.length };
  };
}

export function insertBlock(block: string): MarkdownCommand {
  return ({ value, start, end }) => {
    const before = value.slice(0, start);
    const lead = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const insert = `${lead}${block}\n`;
    const next = before + insert + value.slice(end);
    const caret = start + insert.length;
    return { value: next, start: caret, end: caret };
  };
}

export function insertText(text: string): MarkdownCommand {
  return ({ value, start, end }) => {
    const next = value.slice(0, start) + text + value.slice(end);
    const caret = start + text.length;
    return { value: next, start: caret, end: caret };
  };
}

export function insertLink(): MarkdownCommand {
  return ({ value, start, end }) => {
    const label = value.slice(start, end) || "texto del enlace";
    const url = "https://";
    const insert = `[${label}](${url})`;
    const next = value.slice(0, start) + insert + value.slice(end);
    const urlStart = start + label.length + 3;
    return { value: next, start: urlStart, end: urlStart + url.length };
  };
}

const TABLE_BLOCK = [
  "| Concepto | Detalle |",
  "| --- | --- |",
  "| Ubicación | Valla 12x4 |",
  "| Período | 1 mes |",
].join("\n");

export const COMMANDS = {
  bold: wrapSelection("**"),
  italic: wrapSelection("_"),
  strike: wrapSelection("~~"),
  code: wrapSelection("`"),
  h1: prefixLines("# "),
  h2: prefixLines("## "),
  h3: prefixLines("### "),
  quote: prefixLines("> "),
  bullet: prefixLines("- "),
  numbered: prefixLines("", true),
  link: insertLink(),
  divider: insertBlock("---"),
  table: insertBlock(TABLE_BLOCK),
} satisfies Record<string, MarkdownCommand>;

export type CommandName = keyof typeof COMMANDS;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
