import type { CrmClientSummary, CrmDeal } from "@/api/crm/crm.types";
import { AGENT_NAME } from "@/lib/agent-brand";
import { clientLabel, personName } from "./crm-format";

function isoDate(value: string | null): string | null {
  return value ? value.slice(0, 10) : null;
}

export function dealProposalPrompt(deal: CrmDeal): string {
  const company = deal.brand || clientLabel(deal.client) || deal.title;
  const start = isoDate(deal.campaignStart);
  const end = isoDate(deal.campaignEnd);
  const details = [
    `- Negocio: ${deal.title}`,
    deal.client ? `- Cliente: ${clientLabel(deal.client)}` : null,
    deal.brand ? `- Marca: ${deal.brand}` : null,
    deal.industry ? `- Industria: ${deal.industry}` : null,
    deal.contact ? `- Contacto: ${personName(deal.contact)}${deal.contact.email ? ` (${deal.contact.email})` : ""}` : null,
    deal.targetZones.length > 0 ? `- Zonas objetivo: ${deal.targetZones.join(", ")}` : null,
    start && end ? `- Campaña: del ${start} al ${end}` : null,
    deal.value > 0 ? `- Valor estimado: $${deal.value}` : null,
  ].filter(Boolean);

  return [
    `Hola ${AGENT_NAME}, genera una propuesta para ${company} con las vallas que más le convienen para este negocio.`,
    "",
    ...details,
    "",
    start && end
      ? "Investiga la marca y arma la propuesta para su gerente de marketing."
      : "Investiga la marca y, si te faltan las fechas de campaña, pregúntamelas antes de armar la propuesta.",
  ].join("\n");
}

export function clientResearchPrompt(summary: CrmClientSummary): string {
  const { client } = summary;
  const company = client.name;
  return `Hola ${AGENT_NAME}, investiga a ${company} y dime qué oportunidades de publicidad exterior ves para ellos. Revisa también su historial con nosotros en el CRM.`;
}

export function clientProposalDraft(summary: CrmClientSummary): string {
  const company = summary.client.name;
  return `Hola ${AGENT_NAME}, genera una propuesta para ${company} con las vallas que más le convienen para `;
}
