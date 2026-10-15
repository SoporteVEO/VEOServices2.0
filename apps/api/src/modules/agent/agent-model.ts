import { Logger } from '@nestjs/common';
import type { LanguageModel, SystemModelMessage, ToolSet } from 'ai' with {
  'resolution-mode': 'import',
};

export type AgentProvider = 'google' | 'anthropic';

const PROVIDERS: Record<
  AgentProvider,
  { apiKeyEnv: string; defaultModel: string; modelPrefix: string }
> = {
  google: {
    apiKeyEnv: 'GOOGLE_GENERATIVE_AI_API_KEY',
    defaultModel: 'gemini-3.8-flash',
    modelPrefix: 'gemini-',
  },
  anthropic: {
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-haiku-4-5',
    modelPrefix: 'claude-',
  },
};

const logger = new Logger('AgentModel');
const warnedModels = new Set<string>();

export function getAgentProvider(): AgentProvider {
  const provider = (process.env.AGENT_PROVIDER ?? 'google').toLowerCase();
  if (provider === 'google' || provider === 'anthropic') return provider;
  throw new Error(`Unknown AGENT_PROVIDER: ${provider}`);
}

/**
 * A model id that clearly belongs to another provider (e.g. a leftover
 * `claude-*` while testing on Gemini) falls back to the provider default.
 */
export function getAgentModelId(provider = getAgentProvider()): string {
  const configured = process.env.AGENT_MODEL?.trim();
  const { defaultModel } = PROVIDERS[provider];
  if (!configured) return defaultModel;

  const owner = (Object.keys(PROVIDERS) as AgentProvider[]).find((name) =>
    configured.startsWith(PROVIDERS[name].modelPrefix),
  );
  if (owner && owner !== provider) {
    if (!warnedModels.has(configured)) {
      warnedModels.add(configured);
      logger.warn(
        `AGENT_MODEL="${configured}" is a ${owner} model but AGENT_PROVIDER is "${provider}"; using ${defaultModel}.`,
      );
    }
    return defaultModel;
  }
  return configured;
}

/** Name of the env var that is missing for the active provider, if any. */
export function getMissingAgentApiKey(): string | null {
  const { apiKeyEnv } = PROVIDERS[getAgentProvider()];
  return process.env[apiKeyEnv] ? null : apiKeyEnv;
}

export function isAgentConfigured(): boolean {
  try {
    return getMissingAgentApiKey() === null;
  } catch {
    return false;
  }
}

export async function loadAgentModel(): Promise<{
  model: LanguageModel;
  provider: AgentProvider;
  modelId: string;
}> {
  const provider = getAgentProvider();
  const modelId = getAgentModelId(provider);

  switch (provider) {
    case 'google': {
      const { google } = await import('@ai-sdk/google');
      return { model: google(modelId), provider, modelId };
    }
    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
      const anthropic = createAnthropic({
        headers: workspaceId
          ? { 'anthropic-workspace-id': workspaceId }
          : undefined,
      });
      return { model: anthropic(modelId), provider, modelId };
    }
  }
}

/** Provider-executed web search, keyed by the tool name each provider requires. */
export async function loadWebSearchTools(
  provider: AgentProvider,
): Promise<ToolSet> {
  switch (provider) {
    case 'google': {
      const { google } = await import('@ai-sdk/google');
      return { google_search: google.tools.googleSearch({}) };
    }
    case 'anthropic': {
      const { anthropic } = await import('@ai-sdk/anthropic');
      return {
        web_search: anthropic.tools.webSearch_20250305({
          maxUses: 5,
          userLocation: {
            type: 'approximate',
            city: 'San Salvador',
            region: 'San Salvador',
            timezone: 'America/El_Salvador',
          },
        }),
      };
    }
  }
}

/**
 * Claude only caches with an explicit breakpoint; Gemini caches long stable
 * prefixes on its own.
 */
export function cachedSystemMessage(
  provider: AgentProvider,
  content: string,
): SystemModelMessage {
  if (provider === 'anthropic') {
    return {
      role: 'system',
      content,
      providerOptions: {
        anthropic: { cacheControl: { type: 'ephemeral' } },
      },
    };
  }
  return { role: 'system', content };
}
