import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import { hasScope } from '../agent-scopes.js';
import { normalizeText } from '../agent-text-similarity.js';
import {
  type AgentToolContext,
  toModelText,
  unauthorized,
} from './agent-tool-context.js';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato YYYY-MM-DD');

const DEFAULT_STAGE = 'Negocio Potencial';
const NEXO_TAG = 'Nexo';

interface CrmClientRow {
  id: string;
  name: string;
  company: string | null;
  email: string;
}

interface CrmContactRow {
  id: string;
  firstName: string;
  lastName: string | null;
}

interface CrmPipelineRow {
  id: string;
  name: string;
  stages: { id: string; name: string; kind: string; position: number }[];
}

interface InventoryRow {
  billboardId: number;
  billboardCode: string | null;
}

interface DealSitesResult {
  added: number;
  warnings: string[];
  summary: { heldCount: number; totalValue: number };
}

type Step = { ok: false; error: string };

function sameName(a: string | null | undefined, b: string | null | undefined) {
  return !!a && !!b && normalizeText(a) === normalizeText(b);
}

function clientLabel(client: { name: string }) {
  return client.name;
}

export function buildCrmOpportunityTools(ctx: AgentToolContext) {
  async function findClient(
    name: string,
    company?: string,
  ): Promise<CrmClientRow | null> {
    const response = await ctx.api.request<{ data: CrmClientRow[] }>({
      method: 'GET',
      path: '/crm/clients',
      query: { search: name, pageSize: 20 },
    });
    const rows = response.data?.data ?? [];
    return (
      rows.find(
        (row) =>
          sameName(row.name, name) ||
          sameName(row.company, name) ||
          sameName(row.company, company),
      ) ?? null
    );
  }

  async function resolveClient(input: {
    id?: string;
    name: string;
    company?: string;
    email?: string;
    type: 'DIRECT' | 'AGENCY';
  }): Promise<{ client: CrmClientRow; created: boolean } | Step> {
    if (input.id) {
      const response = await ctx.api.request<{
        data: { client: CrmClientRow };
      }>({ method: 'GET', path: `/crm/clients/${input.id}/summary` });
      if (!response.ok || !response.data) {
        return { ok: false, error: response.error ?? 'Cliente no encontrado' };
      }
      return { client: response.data.data.client, created: false };
    }

    const existing = await findClient(input.name, input.company);
    if (existing) return { client: existing, created: false };

    if (!input.email) {
      return {
        ok: false,
        error: `${input.name} no está registrado en el CRM y falta un correo para registrarlo. Pídeselo al usuario (del contacto o uno general de la empresa); no lo inventes.`,
      };
    }
    const created = await ctx.api.request<{ data: CrmClientRow }>({
      method: 'POST',
      path: '/clients',
      body: {
        type: input.type,
        name: input.name,
        company: input.company,
        email: input.email,
      },
    });
    if (created.ok && created.data) {
      return { client: created.data.data, created: true };
    }
    if (created.status === 409) {
      const byEmail = await ctx.api.request<{ data: CrmClientRow[] }>({
        method: 'GET',
        path: '/crm/clients',
        query: { search: input.email, pageSize: 5 },
      });
      const match = byEmail.data?.data.find(
        (row) => row.email?.toLowerCase() === input.email!.toLowerCase(),
      );
      if (match) return { client: match, created: false };
    }
    return {
      ok: false,
      error: created.error ?? 'No se pudo registrar el cliente',
    };
  }

  async function resolveContact(
    clientId: string,
    clientCreated: boolean,
    input: {
      firstName: string;
      lastName?: string;
      email?: string;
      phone?: string;
      jobTitle?: string;
    },
  ): Promise<{ contact: CrmContactRow; created: boolean } | null> {
    if (!clientCreated) {
      const existing = await ctx.api.request<{ data: CrmContactRow[] }>({
        method: 'GET',
        path: '/crm/contacts',
        query: { clientId, search: input.firstName, pageSize: 20 },
      });
      const fullName = [input.firstName, input.lastName].join(' ');
      const match = existing.data?.data.find((row) =>
        sameName([row.firstName, row.lastName].join(' '), fullName),
      );
      if (match) return { contact: match, created: false };
    }
    const created = await ctx.api.request<{ data: CrmContactRow }>({
      method: 'POST',
      path: '/crm/contacts',
      body: { clientId, isPrimary: clientCreated, ...input },
    });
    return created.ok && created.data
      ? { contact: created.data.data, created: true }
      : null;
  }

  async function resolveStage(stageName: string): Promise<
    | {
        pipelineId: string;
        pipeline: string;
        stage: { id: string; name: string };
      }
    | Step
  > {
    const response = await ctx.api.request<{ data: CrmPipelineRow[] }>({
      method: 'GET',
      path: '/crm/pipelines',
    });
    const pipeline = response.data?.data[0];
    if (!pipeline) {
      return {
        ok: false,
        error: response.error ?? 'No hay pipelines en el CRM',
      };
    }
    const wanted = normalizeText(stageName);
    const open = pipeline.stages
      .filter((stage) => stage.kind === 'OPEN')
      .sort((a, b) => a.position - b.position);
    const stage =
      open.find((s) => normalizeText(s.name) === wanted) ??
      open.find((s) => normalizeText(s.name).includes(wanted)) ??
      open[0];
    if (!stage) {
      return { ok: false, error: 'El pipeline no tiene etapas abiertas' };
    }
    return { pipelineId: pipeline.id, pipeline: pipeline.name, stage };
  }

  async function resolveBillboards(codes: string[], from: string, to: string) {
    if (codes.length === 0) return { ids: [], missing: [] as string[] };
    const response = await ctx.api.request<{ data: InventoryRow[] }>({
      method: 'GET',
      path: '/billboards/available',
      query: { from, to, includeUnavailable: true },
    });
    const byCode = new Map(
      (response.data?.data ?? []).map((row) => [
        row.billboardCode?.trim().toUpperCase(),
        row.billboardId,
      ]),
    );
    const ids: number[] = [];
    const missing: string[] = [];
    for (const code of codes) {
      const id = byCode.get(code.trim().toUpperCase());
      if (id == null) missing.push(code);
      else if (!ids.includes(id)) ids.push(id);
    }
    return { ids, missing };
  }

  return {
    register_crm_opportunity: defineTool({
      description: `Registers a sales opportunity in the CRM in one step: finds or creates the client account, optionally its contact, creates the deal in the "${DEFAULT_STAGE}" stage of the default pipeline and adds the proposed billboards to it (value = sum of their rates). Use it after create_client_proposal when the user wants the proposal in the CRM / pipeline, or asks to register the company. Reuses an existing client when the name matches, so you may call it even if unsure. A NEW client needs an email: use one the user gave you or that appears in an attached file, never invent one; if you have none, ask for it first. Requires user approval in the chat.`,
      inputSchema: z.object({
        client: z.object({
          id: z
            .uuid()
            .optional()
            .describe('Existing CRM client id, if you already found it'),
          name: z.string().min(2).max(120).describe('Brand / account name'),
          company: z
            .string()
            .max(160)
            .optional()
            .describe('Legal or group name, if known'),
          email: z
            .email()
            .optional()
            .describe('Required only for a new client'),
          type: z.enum(['DIRECT', 'AGENCY']).default('DIRECT'),
        }),
        contact: z
          .object({
            firstName: z.string().min(1).max(80),
            lastName: z.string().max(80).optional(),
            email: z.email().optional(),
            phone: z.string().max(30).optional(),
            jobTitle: z.string().max(80).optional(),
          })
          .optional()
          .describe("Only when you know the person's name"),
        deal: z.object({
          title: z
            .string()
            .min(2)
            .max(160)
            .describe('e.g. "Coca-Cola · Apertura en San Salvador"'),
          description: z
            .string()
            .max(2000)
            .optional()
            .describe('Objective and strategy of the proposal'),
          brand: z.string().max(120).optional(),
          industry: z.string().max(60).optional(),
          from: isoDate.describe('Campaign start (YYYY-MM-DD)'),
          to: isoDate.describe('Campaign end (YYYY-MM-DD)'),
          targetZones: z.array(z.string().max(60)).max(14).default([]),
        }),
        billboardCodes: z
          .array(z.string().min(2).max(30))
          .max(20)
          .default([])
          .describe('Codes included in the proposal'),
        hold: z
          .boolean()
          .default(false)
          .describe('Reserve the billboards for the client'),
        stageName: z.string().max(60).default(DEFAULT_STAGE),
      }),
      execute: async (input) => {
        if (!hasScope(ctx.user, 'crm')) return unauthorized('crm');
        if (input.deal.from > input.deal.to) {
          return {
            ok: false as const,
            error: 'La fecha inicial es posterior a la final',
          };
        }

        const [placement, billboards] = await Promise.all([
          resolveStage(input.stageName),
          resolveBillboards(
            input.billboardCodes,
            input.deal.from,
            input.deal.to,
          ),
        ]);
        if ('ok' in placement) return placement;

        const client = await resolveClient(input.client);
        if ('ok' in client) return client;

        const contact = input.contact
          ? await resolveContact(
              client.client.id,
              client.created,
              input.contact,
            )
          : null;

        const deal = await ctx.api.request<{
          data: { id: string; title: string };
        }>({
          method: 'POST',
          path: '/crm/deals',
          body: {
            title: input.deal.title,
            pipelineId: placement.pipelineId,
            stageId: placement.stage.id,
            clientId: client.client.id,
            contactId: contact?.contact.id,
            description: input.deal.description,
            brand: input.deal.brand ?? input.client.name,
            industry: input.deal.industry,
            campaignStart: input.deal.from,
            campaignEnd: input.deal.to,
            targetZones: input.deal.targetZones,
            mediaType: 'STATIC',
            tags: [NEXO_TAG],
          },
        });
        if (!deal.ok || !deal.data) {
          return {
            ok: false as const,
            error: deal.error ?? 'No se pudo crear el negocio',
            clientCreated: client.created,
            client: clientLabel(client.client),
          };
        }
        const dealId = deal.data.data.id;

        let sites: DealSitesResult | null = null;
        if (billboards.ids.length > 0) {
          const response = await ctx.api.request<{ data: DealSitesResult }>({
            method: 'POST',
            path: `/crm/deals/${dealId}/sites`,
            body: {
              sites: billboards.ids.map((billboardId) => ({
                kind: 'STATIC',
                billboardId,
              })),
              startDate: input.deal.from,
              endDate: input.deal.to,
              hold: input.hold,
            },
          });
          sites = response.data?.data ?? null;
          if (sites && sites.summary.totalValue > 0) {
            await ctx.api.request({
              method: 'PATCH',
              path: `/crm/deals/${dealId}`,
              body: { value: sites.summary.totalValue },
            });
          }
        }

        return {
          ok: true as const,
          deal: {
            id: dealId,
            title: deal.data.data.title,
            pipeline: placement.pipeline,
            stage: placement.stage.name,
            value: sites?.summary.totalValue ?? 0,
          },
          client: {
            id: client.client.id,
            name: clientLabel(client.client),
            created: client.created,
          },
          contact: contact
            ? {
                id: contact.contact.id,
                name: [contact.contact.firstName, contact.contact.lastName]
                  .filter(Boolean)
                  .join(' '),
                created: contact.created,
              }
            : null,
          sitesAdded: sites?.added ?? 0,
          sitesHeld: sites?.summary.heldCount ?? 0,
          warnings: [
            ...(sites?.warnings ?? []),
            ...billboards.missing.map((code) => `No se encontró ${code}.`),
            ...(input.contact && !contact
              ? ['No se pudo registrar el contacto.']
              : []),
          ],
        };
      },
      toModelOutput: ({ output }) =>
        toModelText(
          output.ok === true
            ? {
                ...output,
                note: 'El usuario ya ve una tarjeta con el resultado y el botón para abrir el negocio. Resume en una línea qué se creó y menciona las advertencias.',
              }
            : output,
        ),
    }),
  };
}
