# Nexo Integration Guide

How to give **Nexo** (the AI assistant of VEO Services) capabilities in a module, page or component.

> **For the agent reading this:** follow this guide end to end. Read the referenced files before editing them, copy the existing patterns exactly, and finish with the verification checklist at the bottom. Do not invent new architecture: every integration below already has a working example in the repo.

---

## 0. Ground rules

- **Monorepo:** `apps/api` (NestJS, CommonJS, AI SDK v7 loaded with dynamic `import()`, zod 4, Prisma) and `apps/web` (Next 16, React 19, `@ai-sdk/react`, TanStack Query, shadcn/ui).
- **Next.js has breaking changes vs. your training data.** Read `apps/web/node_modules/next/dist/docs/` before writing Next-specific code (routing, layouts, server components).
- **Language:** system prompt, tool descriptions and zod `.describe()` texts are in **English**. Everything the user sees (UI labels, tooltips, prompts sent from buttons, `unauthorized` messages, tool `toModelOutput` hints) is in **Spanish**.
- **Never hardcode the name "Nexo".** Use `AGENT_NAME` from `apps/web/src/lib/agent-brand.ts` (web) or `apps/api/src/modules/agent/agent-brand.ts` (API).
- **UI:** use shadcn components (`@/components/ui/*`, `@/components/primitives/ui/*`). Keep code split into small files, follow surrounding naming, keep comments minimal.
- **React:** no `useEffect` for things that can happen in an event handler or during render. Read <https://react.dev/learn/you-might-not-need-an-effect> before adding one.
- **Permissions are non-negotiable:** Nexo must never see or do more than the user could do in the dashboard.
- **API formatting:** `apps/api` uses Prettier with CRLF line endings. Run `npx prettier --write <files>` on every API file you touch. The web app has no Prettier config: format by hand to match the file.

---

## 1. Pick the integration level

Most features need only some of these. Go top to bottom and stop when the feature is covered.

| # | Level | Use it when | Where |
|---|---|---|---|
| A | **Scope (data access)** | Nexo should read/write a module's data through the existing REST endpoints. | `apps/api/src/modules/agent/agent-scopes.ts` |
| B | **Dedicated tool** | The task is multi-step, needs filtering/ranking/joins, external research, or must render a custom card in the chat. | `apps/api/src/modules/agent/tools/*.tools.ts` |
| C | **Chat card (tool UI)** | The tool's result should be an interactive card (download, save, preview, send) instead of plain text. | `apps/web/src/components/dashboard/agent/parts/` |
| D | **Prompt rules** | Nexo must follow a specific flow, prefer a tool, or avoid a mistake. | `apps/api/src/modules/agent/agent-prompt.ts` |
| E | **Entry point button** | The user should launch Nexo from a page/drawer with a prefilled or auto-sent prompt. | `AskNexoButton` |
| F | **Inline compose** | Nexo should write/improve text inside a form field (subject + body) without opening the chat. | `NexoWriteButton` + `/agent/compose` |
| G | **Academy guide** | Nexo should answer "¿cómo hago…?" questions about the new feature. | `apps/api/src/modules/academy/content/*.ts` |

---

## 2. Level A — Scope (data access through the backend)

Nexo calls the backend **as the logged-in user** through two generic tools: `list_api_endpoints` and `call_api` (`tools/api.tools.ts`). `AgentEndpointsService` discovers every Nest controller route at boot, reads its query/body DTO fields (from `class-validator` metadata) and its guard decorators (`@Public`, `@RequiredRoles`, `@RequiredSubRoles`, …).

**A route is invisible to Nexo until its path prefix belongs to a scope.** Webhook paths (`/webhook`, `/webhooks`) are always skipped.

### Steps

1. Open `apps/api/src/modules/agent/agent-scopes.ts`.
2. If the module's paths are already covered by an existing scope's `pathPrefixes`, you are done with Level A.
3. Otherwise:
   - Add the key to the `AgentScopeKey` union.
   - Add an entry to `AGENT_SCOPES` that **mirrors the sidebar access rules** of the module in `apps/web/src/lib/routes.ts` (`allowedRoles` / `requiredSubRoles`).

```ts
{
  key: 'crm',
  label: 'CRM (Ventas)',                 // Spanish, shown to users
  description:
    'Sales CRM: client accounts, contacts, deals and pipeline, …', // English, read by the model
  allowedRoles: [],                      // [] = no role grants it by itself
  requiredSubRoles: ['VENTAS'],          // any of these sub-roles grants it
  pathPrefixes: ['/crm'],                // controller path prefixes (no /api/v1)
},
```

### Rules

- `allowedRoles` defaults to `['ADMIN', 'USER']` when omitted. Use `[]` + `requiredSubRoles` for sub-role-only modules.
- The **longest matching prefix wins** (`/billboards/dashboard` belongs to `dashboard`, not `static_billboards`).
- Guard decorators on the controller are still enforced on top of the scope, so a route with `@RequiredRoles('ADMIN')` stays admin-only.
- For `call_api` to expose body/query fields, the endpoint must use **DTO classes with class-validator decorators** (or named `@Query('x')` params). Zod-only bodies show no fields; that works, but the model has to guess them. In that case, describe the body in the prompt (Level D) or create a dedicated tool (Level B).
- **Writes need approval automatically:** `call_api` with POST/PUT/PATCH/DELETE pauses for user approval (configured in `agent-chat.service.ts` → `toolApproval`). Do not disable this.
- The user's allowed and denied scopes are injected into the prompt automatically (`buildUserContext` → `partitionScopes`). The web `AgentCapabilities` (`useAgentCapabilities()`) also returns them.

---

## 3. Level B — Dedicated tool

Create one when generic `call_api` is not enough:
- The model would need many calls.
- The result needs ranking or filtering.
- The data is not exposed by any endpoint.
- External research is needed.
- You want a custom chat card.

### Reference implementations

| File | Shows |
|---|---|
| `tools/crm.tools.ts` → `draft_crm_template` | A "UI-only" tool: the input *is* the result, rendered as a card, no side effects. |
| `tools/proposals.tools.ts` → `search_billboard_inventory`, `create_client_proposal`, `research_company` | Calling the backend via `ctx.api.request`, filtering/ranking, validating model-picked IDs, web research. |
| `tools/crm-opportunity.tools.ts` → `register_crm_opportunity` | A multi-step **write** behind one approval (find-or-create client → contact → deal in a named stage → sites → value), with dedupe and partial-failure reporting. Web: `parts/agent-opportunity-part.tsx`. |
| `tools/reports.tools.ts` → `generate_monthly_report` | Searching the backend, then returning data the web turns into a PDF. |
| `tools/api.tools.ts` | Generic `call_api`, permission checks, `limitPayload` / `stripLongUrls` / `toModelText`. |

### Template

File: `apps/api/src/modules/agent/tools/<module>.tools.ts`

```ts
import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import { hasScope } from '../agent-scopes.js';
import {
  type AgentToolContext,
  limitPayload,
  toModelText,
  unauthorized,
} from './agent-tool-context.js';

export function buildMyModuleTools(ctx: AgentToolContext) {
  return {
    my_module_action: defineTool({
      description:
        'What it does, WHEN to use it (user phrasings in Spanish in quotes), and what the chat shows. Say what NOT to do (e.g. "never rebuild this with create_pdf_document").',
      inputSchema: z.object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Start date (YYYY-MM-DD)'),
        search: z.string().min(2).max(80).optional().describe('Code, client or name'),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ from, search, limit }) => {
        if (!hasScope(ctx.user, 'my_scope')) return unauthorized('my_scope');

        const response = await ctx.api.request<{ data: Row[] }>({
          method: 'GET',
          path: '/my-module/items',          // no /api/v1 prefix
          query: { from, search },
        });
        if (!response.ok) {
          return { ok: false as const, error: response.error ?? 'Error al consultar' };
        }
        return {
          ok: true as const,
          items: limitPayload(response.data.data.slice(0, limit)),
        };
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),
  };
}
```

Then register it in `tools/index.ts`:

```ts
import { buildMyModuleTools } from './my-module.tools.js';
// …
export function buildAgentTools(ctx: AgentToolContext) {
  return {
    // …
    ...buildMyModuleTools(ctx),
  };
}
```

### Tool rules

- **Name:** `snake_case`, verb first (`search_…`, `create_…`, `draft_…`, `generate_…`). Tool names are global: check `tools/index.ts` for collisions.
- **Always check permissions inside `execute`.** Call `hasScope(ctx.user, key)` and return `unauthorized(key)` (exact shape `{ ok: false, unauthorized: true, message }`). The web renders it as `AgentUnauthorizedNote`.
- **Call the backend only via `ctx.api.request`.** It forwards the user's own auth, so guards apply. Never query Prisma directly from a tool to bypass permissions.
- **Return shape:**
  - Success: `{ ok: true, … }`.
  - Failure: `{ ok: false, error }`.
  - Use `as const` on `ok` so the web types narrow.
- **Keep the model context small:**
  - Use `toModelOutput: ({ output }) => toModelText(output)`. It caps output at about 24k chars and trims arrays.
  - Wrap big arrays in `limitPayload` (what gets stored in the thread).
  - Wrap outputs that contain signed URLs in `stripLongUrls`.
  - Return compact rows: only the fields the model needs to reason.
- **UI-only tools** (the card does the work): return `{ ok: true }` and make `toModelOutput` a short Spanish hint, e.g. `'El borrador ya se muestra al usuario … No repitas el contenido.'`, so the model doesn't repeat the card as text.
- **Validate anything the model picks.** If the model passes IDs/codes, re-fetch and validate them. Return `missingCodes` / `occupiedCodes` instead of trusting them (see `create_client_proposal`).
- **Side effects:**
  - A tool that writes (sends, creates, deletes) must require approval. Add it to `toolApproval` in `agent-chat.service.ts`, like `send_email: 'user-approval'`.
  - Prefer the "draft card + user clicks Save" pattern (`draft_crm_template`) over writing directly.
- **Dates:**
  - Input uses `YYYY-MM-DD`, months use `YYYY-MM`.
  - The prompt already tells the model how to resolve "noviembre", "el próximo mes", etc.
- **Step budget:** `MAX_STEPS` is 16 (`AGENT_MAX_STEPS` env). If your flow needs many calls, merge them into one tool.
- **External web research:** reuse `researchWeb(query)` from `agent-web-research.ts`. Do not add provider search tools to the main tool map; they conflict with function tools.

---

## 4. Level C — Chat card (rendering the tool in the web)

The web types every tool so `part.input` / `part.output` are typed in `AgentToolPart`.

### Steps

1. **Types:** in `apps/web/src/api/agent/agent.types.ts`:
   - Add the input/output interfaces. Mirror the API zod schema and the return shape.
   - Add an entry to `AgentUITools`:

   ```ts
   my_module_action: {
     input: MyModuleInput;
     output: ToolResult<MyModuleOutput>;   // = MyModuleOutput | AgentUnauthorized | AgentToolError
   };
   ```

   `ToolResult<T>` is defined in the same file. For UI-only tools use `{ ok: true } | AgentUnauthorized`.

2. **Card component:** create `apps/web/src/components/dashboard/agent/parts/agent-<name>-card.tsx`. Base it on an existing card:
   - `agent-template-draft-card.tsx`: preview + Copy + Save via a mutation, then a link to the module.
   - `agent-proposal-card.tsx`: summary + "Descargar PDF" generated on click.
   - `agent-research-card.tsx`: markdown + sources.
   - `agent-report-card.tsx` / `agent-monthly-report-card.tsx`: download / send actions.

   Wrap the card in `AgentPartFrame` when it needs the standard bordered frame. Do heavy work (PDF generation, fetching images) **on click**, not on render or in effects.

3. **Wire it in** `parts/agent-tool-part.tsx`:
   - Add a Spanish progress label to `TOOL_LABELS` (e.g. `my_module_action: "Buscando elementos"`).
   - Add a `case "tool-my_module_action":` following the existing pattern:

   ```tsx
   case "tool-my_module_action": {
     if (part.state === "input-streaming" || !part.input) {
       return <BuildingPlaceholder label="Preparando…" />;
     }
     if (part.state === "output-available" && part.output.ok === true) {
       return <AgentMyModuleCard input={part.input} output={part.output} />;
     }
     if (part.state === "output-available" && isUnauthorized(part.output)) {
       return <AgentUnauthorizedNote message={part.output.message} />;
     }
     return (
       <AgentToolStatus
         label={TOOL_LABELS.my_module_action}
         state={part.state}
         output={part.state === "output-available" ? part.output : undefined}
         errorText={
           part.state === "output-error"
             ? part.errorText
             : part.state === "output-available"
               ? toolErrorText(part.output)
               : undefined
         }
       />
     );
   }
   ```

   - Tools without a card only need a `TOOL_LABELS` entry plus an `AgentToolStatus` case (or they fall through to the default status line).
   - While streaming, `part.input` is a *partial* object: arrays may contain `undefined`. Type helper params loosely (e.g. `keywords?: (string | undefined)[]`).

4. **PDFs:** branded PDFs use `@react-pdf/renderer` and live in `apps/web/src/components/pages/<module>/…/pdf/`. Reuse the parts in `components/pages/reports/pdf/` (styles, cover, about pages, `loadReportImage`). Generate with a `generate-*.tsx` function that returns `{ blob, fileName }` and is imported from the card's click handler.

---

## 5. Level D — Prompt rules

File: `apps/api/src/modules/agent/agent-prompt.ts` (`AGENT_SYSTEM_PROMPT`).

- **Keep it static.** It is cached together with the tool schemas, so never interpolate per-request data into it. Per-user data goes in `buildUserContext`.
- Write in English, imperative, concise. Quote Spanish phrasings users say (e.g. `"reporte mensual"`).
- Add a numbered section under "Operating rules", or extend an existing one. Renumber the sections that follow (Style and Learning are always last). Include:
  - **When** to use the new tool(s) (user phrasings).
  - **The flow**, if multi-step (see section "Client proposals").
  - **What not to do** (e.g. "Do not POST /crm/templates yourself unless…").
- If the feature is a new kind of topic, check "Topic scope (strict)" still allows it.
- Most behaviour belongs in the **tool description**; put only cross-tool flows and priorities in the prompt.

---

## 6. Level E — Entry point buttons (`AskNexoButton`)

File: `apps/web/src/components/dashboard/agent/ask-nexo-button.tsx`.

It opens the Nexo panel in a **new conversation** and either sends a prompt immediately or prefills the composer. Under the hood it calls `useAgentPanel().ask({ prompt, send })` from `agent-panel-context.tsx`, which sends from the click handler (no effects).

```tsx
import { AskNexoButton } from "@/components/dashboard/agent/ask-nexo-button";
import { AGENT_NAME } from "@/lib/agent-brand";

<AskNexoButton
  sizeVariant="sm"
  label="Propuesta"                                   // default: "Pregúntale a Nexo"
  hint={`${AGENT_NAME} arma una propuesta por ti`}    // tooltip, default: "Deja que Nexo haga este trabajo por ti"
  prompt={`Hola ${AGENT_NAME}, …`}
  send                                                // false → prefill only, user completes it
  scope="crm"                                         // hide if the user lacks this scope
  onAsk={onClose}                                     // run before opening (close drawers/dialogs!)
/>
```

### Rules

- **`send` vs. `send={false}`:**
  - Use `send` (default) when the prompt is complete, e.g. "explain this article" or "propose for this deal".
  - Use `send={false}` when the user must add something, e.g. a company name. End the draft so the user can keep typing (`"…a la empresa "`).
- **Close modals first.** Drawers (vaul) and dialogs are modal and would cover the panel and block clicks, so pass `onAsk={onClose}`.
- **Build prompts from real page data**, in Spanish, starting with `Hola ${AGENT_NAME}, …`. Include IDs/codes/dates/names the tools can search by. Use ISO dates (`YYYY-MM-DD`) and month keys (`YYYY-MM`).
- **Link app pages as Markdown** (`[Título](/dashboard/…)`). Nexo knows that `/dashboard/academy/<slug>` links mean "read that article".
- **Prompt builders:** put them in a module-level helper file when they're non-trivial or reused, e.g. `components/pages/crm/crm-nexo-prompts.ts` (`dealProposalPrompt`, `clientResearchPrompt`, `clientProposalDraft`).
- **Visibility:** the button hides itself when Nexo is disabled. Pass `scope` when the page is reachable by users who may not have the Nexo scope the prompt needs.
- **Styling:** keep the default `outline` variant (lime "AI" accent via `NEXO_ACCENT_CLASS`, sparkles icon). Use `variant="default"` only when it is the primary action of a callout (e.g. the Academy footer).
- **Placement:**
  - Page toolbars: `sideButtons` of tables, next to date pickers.
  - Drawer headers: next to the primary actions.
  - Empty states.
  - Section headers.

### Existing placements (copy these)

| Where | File |
|---|---|
| Academy article footer (auto-sends article link) | `components/pages/academy/academy-ask-nexo.tsx` |
| CRM deal drawer header | `components/pages/crm/deal/crm-deal-drawer.tsx` |
| CRM client drawer header (send + prefill) | `components/pages/crm/clients/crm-client-drawer.tsx` |
| CRM dashboard toolbar | `components/pages/crm/dashboard/crm-dashboard-page.tsx` |
| CRM availability (when a deal is selected) | `components/pages/crm/inventory/crm-availability-page.tsx` |
| Static billboards toolbar (uses selected rows) | `components/pages/static-billboards/ask-nexo-proposal-button.tsx` |
| Reports toolbar | `app/dashboard/reports/page.tsx` |
| Analytics tabs | `components/pages/analytics/analytics-page-tabs.tsx` |

Also consider adding a suggestion for the new scope in `agent-empty-state.tsx` (`SUGGESTIONS`, filtered by scope, max 4 shown).

---

## 7. Level F — Inline compose (`NexoWriteButton`)

For "write this for me" inside a form, without opening the chat. It shows a popover with an instruction box and quick chips. It calls `POST /agent/compose` and applies `{ subject, body }` to the form, with an "Deshacer" toast.

```tsx
import { NexoWriteButton } from "@/components/dashboard/agent/nexo-write-button";

<NexoWriteButton
  kind="crm_email"
  current={{ subject: form.subject, body: form.body }}   // empty body → "Redactar", otherwise "Mejorar"
  context={{ "contacto.nombre": "Ana", "negocio.titulo": "…" }} // Record<string,string>, ≤2000 chars each
  suggestions={["Seguimiento amable a la cotización"]}
  onApply={({ subject, body }) => patch({ subject, body })}
/>
```

`MarkdownEditor` (`components/pages/crm/templates/markdown-editor.tsx`) accepts an `actions` slot for it. Other forms can render it next to the field label.

### Adding a new `kind` (e.g. a production order note)

1. **API schema:** `apps/api/src/modules/agent/dto/agent-chat.schema.ts`. Add the value to the `kind` enum in `agentComposeBodySchema`.
2. **API service:** `apps/api/src/modules/agent/agent-compose.service.ts`.
   - Add an instructions builder for the kind, reusing `BASE_RULES` or writing a new base if it's not an email.
   - Choose it in `compose()`.
   - Add the scope check for that kind (currently it requires `crm`). Make the check depend on `kind`.
   - If the output is not subject + body, keep the shape anyway (`subject` may be `''`) so the web stays generic.
3. **Web type:** `apps/web/src/api/agent/agent.types.ts`. Add the value to `AgentComposeRequest["kind"]`.
4. **Web component:** the description line in `NexoWriteButton` branches on `kind`, so add a line for the new kind.

---

## 8. Level G — Academy guide

Nexo answers "¿cómo hago…?" questions only from VEO Academy (`search_academy` → `get_academy_article`).

- Content lives in `apps/api/src/modules/academy/content/<category>.ts` as `AcademyArticleSource[]`. Fields:
  - `slug`, `title`, `category`, `summary`, `tags` (Spanish phrasings users type).
  - `modules` (`{ label, href: '/dashboard/…' }`), `related` (slugs).
  - `body` (Markdown).
- Body links:
  - `academy:<slug>#<anchor>` for other articles.
  - `app:/dashboard/...` for modules.
  - Anchors are slugified headings.
- Only describe buttons and steps that really exist in the UI.
- Validate with `npx tsx scripts/check-academy.ts` in `apps/api`, if present.

---

## 9. File attachments (already supported)

Users can attach up to 5 files of 8 MB each: images, PDF, `text/*`, JSON, and CSV. Spreadsheets are converted to CSV in the browser. Nothing is needed per module, but:
- If your feature benefits from a file (a brief, a list of codes, a photo), mention it in the button hint or the empty-state suggestion.
- Server validation: `apps/api/src/modules/agent/agent-attachments.ts`.
- Client conversion: `apps/web/src/lib/agent-attachments.ts`. Extend the allow-lists in both if you need a new type.

---

## 10. Security checklist

- [ ] New paths are claimed by a scope whose roles mirror `apps/web/src/lib/routes.ts`.
- [ ] Every dedicated tool checks `hasScope` in `execute` and returns `unauthorized(key)`.
- [ ] Tools reach data only through `ctx.api.request` (user auth), never via Prisma or a service directly. Exception: static content such as Academy.
- [ ] Write/send/delete actions require approval (`toolApproval`) or are draft cards the user saves.
- [ ] Model-provided IDs are re-validated against the backend.
- [ ] No secrets, internal URLs, stack traces or signed URLs are sent to the model (`stripLongUrls`).
- [ ] Outputs are bounded (`limitPayload`, `toModelText`, `slice(0, limit)`).

---

## 11. Verification

Run from the repo root:

```powershell
cd apps/api; npx prettier --write <changed api files>; npx tsc --noEmit -p tsconfig.json; npx eslint src/modules/agent <other changed dirs>
cd ../web; npx tsc --noEmit -p tsconfig.json; npx eslint <changed web files/dirs>
```

Notes:
- `jsx-a11y/alt-text` warnings on `@react-pdf/renderer` `<Image>` are expected (it has no `alt` prop).
- Run eslint on the files you changed; some unrelated files have pre-existing errors.

Manual test with a user that **has** the scope and one that **doesn't**:
1. The button is visible only when it should be.
2. Clicking it opens a new chat, and the prompt is sent or prefilled.
3. Nexo calls the expected tool. Watch the status line or card in the chat.
4. The card actions work (download, save, send).
5. A user without access gets the Spanish "No estás autorizado…" note, not data.
6. Write actions show the approval card before executing.

---

## 12. Quick map of the Nexo code

**API** (`apps/api/src/modules/agent/`):

| File | Purpose |
|---|---|
| `agent-scopes.ts` | Scopes and permission helpers (`hasScope`, `findScopeForPath`). |
| `agent-endpoints.service.ts` | Auto-discovery of controller routes for `call_api`. |
| `agent-prompt.ts` | System prompt and per-user context. |
| `agent-chat.service.ts` | `streamText`, tool map, `toolApproval`, step limit, attachments. |
| `agent-compose.service.ts` + `dto/agent-chat.schema.ts` | `/agent/compose` inline writing. |
| `agent-web-research.ts` | `researchWeb()` for brand/company research. |
| `tools/index.ts` | Registry of all tools. |
| `tools/agent-tool-context.ts` | `AgentToolContext`, `unauthorized`, `toModelText`, `limitPayload`, `stripLongUrls`. |
| `tools/*.tools.ts` | Tool implementations by domain. |

**Web** (`apps/web/src/`):

| File | Purpose |
|---|---|
| `api/agent/agent.types.ts` | `AgentUITools` (tool input/output types), compose types, `isUnauthorized`. |
| `api/agent/agent.get.ts` / `agent.mutations.ts` | `useAgentCapabilities`, `useAgentCompose`, … |
| `components/dashboard/agent/agent-panel-context.tsx` | `useAgentPanel()`: `ask`, `setOpen`, `startNewChat`. |
| `components/dashboard/agent/ask-nexo-button.tsx` | Entry point button. |
| `components/dashboard/agent/nexo-write-button.tsx` | Inline compose popover. |
| `components/dashboard/agent/parts/agent-tool-part.tsx` | Tool → card/status rendering switch. |
| `components/dashboard/agent/parts/*-card.tsx` | Existing cards to copy. |
| `components/dashboard/agent/agent-empty-state.tsx` | Scope-filtered suggestions. |
| `lib/agent-brand.ts` | `AGENT_NAME` and greeting. |
