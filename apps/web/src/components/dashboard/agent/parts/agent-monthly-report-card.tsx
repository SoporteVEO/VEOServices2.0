"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Presentation, Send } from "lucide-react";
import { toast } from "sonner";
import {
  getActiveContracts,
  type ActiveContractGroup,
} from "@/api/contracts/contracts.get";
import type {
  AgentMonthlyReportContract,
  AgentMonthlyReportOutput,
} from "@/api/agent/agent.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildContractReport,
  buildInitialSelection,
  formatReportProgress,
  sendContractReport,
} from "@/components/pages/reports/contract-report-actions";
import {
  formatMonthLabel,
  monthFromKey,
  startOfNextMonth,
} from "@/components/pages/reports/report-period";
import { SendReportDialog } from "@/components/pages/reports/send-report-dialog";
import type { ContractReportProgress } from "@/lib/generate-contract-report";
import { downloadBlob } from "@/lib/pdf-download";
import { AgentPartFrame } from "./agent-part-frame";

const VISIBLE_CODES = 8;

export function AgentMonthlyReportCard({
  report,
}: {
  report: AgentMonthlyReportOutput;
}) {
  const month = monthFromKey(report.month);
  const periodLabel = formatMonthLabel(month);

  if (report.contracts.length === 0) {
    return (
      <AgentPartFrame
        icon={Presentation}
        title="Reporte mensual de vallas"
        description={`${periodLabel} · sin contratos activos para “${report.search}”`}
      />
    );
  }

  return (
    <AgentPartFrame
      icon={Presentation}
      title="Reporte mensual de vallas"
      description={`${periodLabel} · ${report.total} ${report.total === 1 ? "contrato" : "contratos"}`}
    >
      <ul className="divide-y">
        {report.contracts.map((contract) => (
          <ContractReportItem
            key={contract.contractNumber}
            contract={contract}
            month={month}
            periodLabel={periodLabel}
          />
        ))}
      </ul>
    </AgentPartFrame>
  );
}

async function loadContractGroup(
  contractNumber: string,
  month: Date,
): Promise<ActiveContractGroup> {
  const page = await getActiveContracts({
    from: month,
    to: startOfNextMonth(month),
    search: contractNumber,
    pageSize: 10,
  });
  const group = page.data.find((g) => g.contractNumber === contractNumber);
  if (!group) throw new Error("El contrato ya no está activo en este mes.");
  return group;
}

function ContractReportItem({
  contract,
  month,
  periodLabel,
}: {
  contract: AgentMonthlyReportContract;
  month: Date;
  periodLabel: string;
}) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ContractReportProgress | null>(null);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const busy = progress !== null;

  async function prepareReport() {
    setProgress({ stage: "Cargando datos", current: 0, total: 1 });
    const group = await loadContractGroup(contract.contractNumber, month);
    const selection = buildInitialSelection(group);
    const report = await buildContractReport({
      group,
      month,
      selection,
      onProgress: setProgress,
    });
    return { group, report };
  }

  async function handleDownload() {
    try {
      const { report } = await prepareReport();
      downloadBlob(report.blob, report.fileName);
      toast.success("Reporte generado correctamente.");
    } catch (error) {
      console.error("Error generating monthly report:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo generar el reporte.",
      );
    } finally {
      setProgress(null);
    }
  }

  async function handleSend(email: string) {
    try {
      const { group, report } = await prepareReport();
      await sendContractReport({
        group,
        month,
        report,
        email,
        onProgress: setProgress,
      });
      toast.success(`Reporte enviado a ${email}.`);
      queryClient.invalidateQueries({ queryKey: ["contracts", "active"] });
      queryClient.invalidateQueries({
        queryKey: ["contracts", "reports-sended"],
      });
      queryClient.invalidateQueries({ queryKey: ["notifications", "active"] });
      setIsSendOpen(false);
    } catch (error) {
      console.error("Error sending monthly report:", error);
      toast.error("No se pudo enviar el reporte.");
    } finally {
      setProgress(null);
    }
  }

  const progressLabel = formatReportProgress(progress);
  const hiddenCodes = contract.totalBillboards - VISIBLE_CODES;

  return (
    <li className="space-y-2.5 p-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold">
            {contract.contractNumber}
          </span>
          <Badge variant="outline" className="text-[11px] tabular-nums">
            {contract.billboardsWithImages}/{contract.totalBillboards} vallas
            con imagen
          </Badge>
          {contract.reportsSendedCount > 0 ? (
            <Badge variant="secondary" className="text-[11px] tabular-nums">
              {contract.reportsSendedCount} enviados
            </Badge>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {[contract.customerName, contract.description]
            .filter(Boolean)
            .join(" · ") || "Sin cliente"}
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {contract.billboardCodes.slice(0, VISIBLE_CODES).map((code) => (
          <Badge
            key={code}
            variant="secondary"
            className="font-mono text-[11px]"
          >
            {code}
          </Badge>
        ))}
        {hiddenCodes > 0 ? (
          <Badge variant="outline" className="text-[11px]">
            +{hiddenCodes}
          </Badge>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="justify-center"
          icon={Download}
          loading={busy && !isSendOpen}
          disabled={busy}
          onClick={handleDownload}
        >
          {busy && !isSendOpen ? progressLabel : "Descargar"}
        </Button>
        <Button
          className="justify-center"
          icon={Send}
          disabled={busy}
          onClick={() => setIsSendOpen(true)}
        >
          Enviar al cliente
        </Button>
      </div>

      <SendReportDialog
        open={isSendOpen}
        onOpenChange={setIsSendOpen}
        defaultEmail={contract.customerEmail}
        contractNumber={contract.contractNumber}
        periodLabel={periodLabel}
        totalBillboardsCount={contract.totalBillboards}
        selectedImagesCount={contract.billboardsWithImages}
        isSubmitting={busy}
        progressLabel={progressLabel}
        onSubmit={handleSend}
      />
    </li>
  );
}
