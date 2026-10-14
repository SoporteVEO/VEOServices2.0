import { Logger } from '@nestjs/common';
import type { AgentSdk, AgentToolSet } from '../agent-sdk.js';
import { hasScope, type AgentUser } from '../agent-scopes.js';

const logger = new Logger('BriloMcpTools');

export interface McpToolBundle {
  tools: AgentToolSet;
  close: () => Promise<void>;
}

const EMPTY: McpToolBundle = { tools: {}, close: async () => {} };

/**
 * One MCP client per chat request: the Brilo MCP server is stateless, so the
 * client is opened for the request and closed when the stream ends.
 */
export async function loadBriloMcpTools(
  sdk: AgentSdk,
  user: AgentUser,
): Promise<McpToolBundle> {
  const url = process.env.BRILO_MCP_URL;
  if (!url || !hasScope(user, 'erp_sql')) return EMPTY;

  try {
    const client = await sdk.mcp.createMCPClient({
      transport: {
        type: 'http',
        url,
        headers: process.env.BRILO_MCP_TOKEN
          ? { Authorization: `Bearer ${process.env.BRILO_MCP_TOKEN}` }
          : undefined,
      },
    });
    const tools = (await client.tools()) as AgentToolSet;
    return {
      tools,
      close: () => client.close().catch(() => undefined),
    };
  } catch (error) {
    logger.warn(
      `Brilo MCP unavailable: ${error instanceof Error ? error.message : String(error)}`,
    );
    return EMPTY;
  }
}
