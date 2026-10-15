"use client";

import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { AskNexoButton } from "@/components/dashboard/agent/ask-nexo-button";
import { AGENT_NAME } from "@/lib/agent-brand";

const MAX_CODES = 20;

interface AskNexoProposalButtonProps {
  from: string;
  to: string;
  selectedRows?: AvailableBillboardListing[];
}

function proposalDraft(
  from: string,
  to: string,
  selectedRows: AvailableBillboardListing[],
): string {
  const codes = selectedRows
    .map((row) => row.billboardCode)
    .filter((code): code is string => Boolean(code))
    .slice(0, MAX_CODES);
  const period = `del ${from} al ${to}`;
  if (codes.length > 0) {
    return `Hola ${AGENT_NAME}, arma una propuesta ${period} con estas vallas: ${codes.join(", ")}. La empresa es `;
  }
  return `Hola ${AGENT_NAME}, genera una propuesta ${period} con las vallas que más le convienen a la empresa `;
}

export function AskNexoProposalButton({
  from,
  to,
  selectedRows = [],
}: AskNexoProposalButtonProps) {
  return (
    <AskNexoButton
      label="Propuesta con IA"
      hint={`${AGENT_NAME} investiga la marca, elige las vallas ideales y arma el PDF por ti`}
      prompt={proposalDraft(from, to, selectedRows)}
      send={false}
    />
  );
}
