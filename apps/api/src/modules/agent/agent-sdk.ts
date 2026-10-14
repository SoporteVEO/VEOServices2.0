import type { Tool } from 'ai' with { 'resolution-mode': 'import' };

/**
 * The AI SDK ships as ESM only while this API compiles to CommonJS, so it is
 * loaded through dynamic `import()` the same way `better-auth` is.
 */
export async function loadAgentSdk() {
  const [ai, mcp] = await Promise.all([import('ai'), import('@ai-sdk/mcp')]);
  return { ai, mcp };
}

export type AgentSdk = Awaited<ReturnType<typeof loadAgentSdk>>;

/** Runtime no-op that mirrors `tool()` from `ai` for type inference. */
export function defineTool<INPUT, OUTPUT>(
  tool: Tool<INPUT, OUTPUT>,
): Tool<INPUT, OUTPUT> {
  return tool;
}

export type AgentToolSet = Record<string, Tool>;
