import { loadAgentModel, loadWebSearchTools } from './agent-model.js';
import { loadAgentSdk } from './agent-sdk.js';

const MAX_SOURCES = 8;
const MAX_OUTPUT_TOKENS = 2000;

const RESEARCH_INSTRUCTIONS = `You are the market research assistant of VEO, an out-of-home advertising company in El Salvador (static billboards and digital DOOH screens). Search the web and write a brief in neutral Spanish that a VEO sales executive will use to pitch billboards to the company.

Cover, when the search results support it:
- What the company or brand sells, its main product lines and positioning.
- Its presence in El Salvador and Central America (stores, plants, distributors, recent openings or expansion news).
- Target audience and the tone of its recent campaigns.
- Recent news relevant to an advertising pitch (launches, new businesses, sponsorships).

Rules:
- Only state facts found in the search results; never invent figures, dates or names. If something is unknown, omit it.
- Prefer sources from the last two years and from El Salvador or the region.
- Plain text with short "##" headings and bullets, at most 300 words. No greetings, no conclusions about VEO.`;

export interface WebResearchSource {
  title: string;
  url: string;
}

export interface WebResearchResult {
  summary: string;
  sources: WebResearchSource[];
}

/**
 * Runs in its own model call because provider-executed search tools cannot be
 * mixed with the function tools of the main conversation on every provider.
 */
export async function researchWeb(query: string): Promise<WebResearchResult> {
  const [{ ai }, { model, provider }] = await Promise.all([
    loadAgentSdk(),
    loadAgentModel(),
  ]);
  const result = await ai.generateText({
    model,
    instructions: RESEARCH_INSTRUCTIONS,
    prompt: query,
    tools: await loadWebSearchTools(provider),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    temperature: 0.2,
  });

  const seen = new Set<string>();
  const sources: WebResearchSource[] = [];
  for (const source of result.sources) {
    if (source.sourceType !== 'url' || seen.has(source.url)) continue;
    seen.add(source.url);
    sources.push({
      title: source.title || hostOf(source.url),
      url: source.url,
    });
    if (sources.length >= MAX_SOURCES) break;
  }
  return { summary: result.text.trim(), sources };
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
