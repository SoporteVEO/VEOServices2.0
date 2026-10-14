import type { UIMessage } from 'ai' with { 'resolution-mode': 'import' };

const TOOL_INPUT_MAX_CHARS = 400;

export interface AgentToolCallSummary {
  tool: string;
  input: string;
}

export function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('\n')
    .trim();
}

export function toolCallsOf(message: UIMessage): AgentToolCallSummary[] {
  return message.parts.flatMap((part) => {
    const named = part as { type: string; toolName?: string; input?: unknown };
    const tool =
      named.type === 'dynamic-tool'
        ? named.toolName
        : named.type.startsWith('tool-')
          ? named.type.slice(5)
          : undefined;
    if (!tool) return [];
    return [
      {
        tool,
        input: clipText(
          JSON.stringify(named.input ?? {}),
          TOOL_INPUT_MAX_CHARS,
        ),
      },
    ];
  });
}

/** The user's text that the assistant message at `index` is answering. */
export function questionFor(messages: UIMessage[], index: number): string {
  for (let i = index - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messageText(messages[i]);
  }
  return '';
}

export function lastUserText(messages: UIMessage[]): string {
  return questionFor(messages, messages.length);
}

export function clipText(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}
