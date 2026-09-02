"use client";

import { useState } from "react";
import {
  Ban,
  Calculator,
  CheckCircle2,
  Play,
  Save,
  Snowflake,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdvancePrintJob,
  useCancelPrintJob,
  useDeletePrintJob,
  useUpdatePrintJob,
} from "@/api/printing/printing.mutations";
import {
  computePrintMinutes,
  dailyCapacityFor,
} from "@/api/printing/printing.print-time";
import type {
  PrintJob,
  PrintJobAction,
  PrintingMachine,
} from "@/api/printing/printing.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import {
  PHASE_LABELS,
  PHASE_SWATCHES,
  PRINT_JOB_STATUS_LABELS,
  PRINT_JOB_STATUS_STYLES,
  SNAP_MINUTES,
  applyTimeToDate,
  clampMinutes,
  formatArea,
  formatDateTime,
  formatDay,
  formatMinutes,
  formatSize,
  isJobLocked,
  sanitizeInteger,
  toTimeInputValue,
} from "./printing-calendar-utils";

type Props = {
  job: PrintJob | null;
  machines: PrintingMachine[];
  /** Every job in the loaded window, used to read the day's used capacity. */
  jobs: PrintJob[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** The single action available from each state, in workflow order. */
const NEXT_ACTION: Partial<
  Record<
    PrintJob["status"],
    { action: PrintJobAction; label: string; icon: typeof Play }
  >
> = {
  SCHEDULED: { action: "START_SETUP", label: "Iniciar set up", icon: Play },
  SETUP: { action: "START_PRINT", label: "Iniciar impresión", icon: Play },
  PRINTING: {
    action: "START_COOLDOWN",
    label: "Iniciar cooldown",
    icon: Snowflake,
  },
  COOLDOWN: { action: "COMPLETE", label: "Finalizar", icon: CheckCircle2 },
};

export function PrintJobDialog({
  job,
  machines,
  jobs,
  open,
  onOpenChange,
}: Props) {
  const [machineId, setMachineId] = useState("");
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [timeValue, setTimeValue] = useState("");
  const [setupMinutes, setSetupMinutes] = useState("0");
  const [printMinutes, setPrintMinutes] = useState("0");
  const [cooldownMinutes, setCooldownMinutes] = useState("0");

  const update = useUpdatePrintJob();
  const advance = useAdvancePrintJob();
  const cancel = useCancelPrintJob();
  const remove = useDeletePrintJob();

  // Re-seed the form whenever a different job (or a fresh version of it) opens,
  // and forget the seed on close so unsaved edits never resurface.
  const formKey = job ? `${job.id}:${job.updatedAt}` : null;
  const [seededKey, setSeededKey] = useState<string | null>(null);
  if (formKey !== seededKey) {
    setSeededKey(formKey);
    if (job) {
      setMachineId(job.machineId);
      setDateValue(new Date(job.scheduledStartAt));
      setTimeValue(toTimeInputValue(job.scheduledStartAt));
      setSetupMinutes(String(job.setupMinutes));
      setPrintMinutes(String(job.printMinutes));
      setCooldownMinutes(String(job.cooldownMinutes));
    }
  }

  if (!job) return null;

  const locked = isJobLocked(job.status);
  const next = NEXT_ACTION[job.status];
  const busy =
    update.isPending || advance.isPending || cancel.isPending || remove.isPending;

  const selectedMachine =
    machines.find((machine) => machine.id === machineId) ?? null;
  // What the machine's throughput says this panel should take, offered as a
  // one-click correction whenever the stored time has drifted from it.
  const derivedPrintMinutes = selectedMachine
    ? computePrintMinutes(job.areaM2, selectedMachine.printSpeedM2PerHour)
    : null;

  async function handleSave() {
    if (!job) return;
    const startAt = applyTimeToDate(dateValue, timeValue);
    if (!startAt) {
      toast.error("Selecciona una fecha y una hora de inicio.");
      return;
    }
    try {
      await update.mutateAsync({
        jobId: job.id,
        machineId,
        scheduledStartAt: startAt.toISOString(),
        setupMinutes: clampMinutes(setupMinutes, 0),
        printMinutes: clampMinutes(printMinutes, 1),
        cooldownMinutes: clampMinutes(cooldownMinutes, 0),
      });
      toast.success("Trabajo actualizado.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo actualizar el trabajo.",
      );
    }
  }

  async function handleAdvance(action: PrintJobAction, label: string) {
    if (!job) return;
    try {
      await advance.mutateAsync({ jobId: job.id, action });
      toast.success(`${label} registrado.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo avanzar el trabajo.",
      );
    }
  }

  async function handleCancel() {
    if (!job) return;
    try {
      await cancel.mutateAsync(job.id);
      toast.success("Trabajo cancelado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo cancelar el trabajo.",
      );
    }
  }

  async function handleDelete() {
    if (!job) return;
    try {
      await remove.mutateAsync(job.id);
      toast.success("Trabajo eliminado del calendario.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo eliminar el trabajo.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-base">
              {job.item.billboardCode ?? "Valla sin código"}
            </DialogTitle>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                PRINT_JOB_STATUS_STYLES[job.status],
              )}
            >
              {PRINT_JOB_STATUS_LABELS[job.status]}
            </span>
          </div>
          <DialogDescription>
            {job.order.offerNumber} ·{" "}
            {job.order.customerCompany ?? job.order.customerName} ·{" "}
            {formatSize(job.item.width, job.item.height)}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Programación
            </h4>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-2 sm:col-span-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Máquina
                </span>
                <Select
                  value={machineId}
                  onValueChange={setMachineId}
                  disabled={locked || busy}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DatePicker
                label="Fecha"
                value={dateValue}
                onChange={(date) => setDateValue(date ?? null)}
                disabled={locked || busy}
              />
              <TimePicker
                label="Hora de inicio"
                value={timeValue}
                onChange={setTimeValue}
                step={SNAP_MINUTES}
                disabled={locked || busy}
              />
              <div className="flex flex-col justify-end pb-1.5">
                <span className="text-xs text-muted-foreground">
                  Duración total{" "}
                  <strong className="text-foreground">
                    {formatMinutes(
                      clampMinutes(setupMinutes, 0) +
                        clampMinutes(printMinutes, 0) +
                        clampMinutes(cooldownMinutes, 0),
                    )}
                  </strong>
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MinutesField
                phase="SETUP"
                value={setupMinutes}
                onChange={setSetupMinutes}
                disabled={locked || busy}
              />
              <MinutesField
                phase="PRINTING"
                value={printMinutes}
                onChange={setPrintMinutes}
                disabled={locked || busy}
              />
              <MinutesField
                phase="COOLDOWN"
                value={cooldownMinutes}
                onChange={setCooldownMinutes}
                disabled={locked || busy}
              />
            </div>

            <CapacityNote
              job={job}
              machine={selectedMachine}
              jobs={jobs}
              day={dateValue}
              derivedPrintMinutes={derivedPrintMinutes}
              printMinutes={printMinutes}
              disabled={locked || busy}
              onUseDerived={() =>
                derivedPrintMinutes !== null &&
                setPrintMinutes(String(derivedPrintMinutes))
              }
            />
          </section>

          <section className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Registro de tiempos
            </h4>
            <dl className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
              <TimeRow label="Inicio planificado" value={job.scheduledStartAt} />
              <TimeRow label="Set up iniciado" value={job.setupStartedAt} />
              <TimeRow label="Impresión iniciada" value={job.printStartedAt} />
              <TimeRow label="Cooldown iniciado" value={job.cooldownStartedAt} />
              <TimeRow label="Finalizado" value={job.completedAt} />
              <TimeRow label="Cancelado" value={job.cancelledAt} />
            </dl>

            <dl className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
              <ActualRow
                label="Set up real"
                actual={job.actualSetupMinutes}
                planned={job.setupMinutes}
              />
              <ActualRow
                label="Impresión real"
                actual={job.actualPrintMinutes}
                planned={job.printMinutes}
              />
              <ActualRow
                label="Cooldown real"
                actual={job.actualCooldownMinutes}
                planned={job.cooldownMinutes}
              />
              <ActualRow
                label="Total real"
                actual={job.actualTotalMinutes}
                planned={job.plannedTotalMinutes}
              />
              {job.startDelayMinutes !== null ? (
                <div className="flex items-center justify-between gap-2 sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">
                    Desviación al iniciar
                  </dt>
                  <dd
                    className={cn(
                      "text-xs font-semibold tabular-nums",
                      job.startDelayMinutes > 15
                        ? "text-rose-600"
                        : "text-emerald-600",
                    )}
                  >
                    {job.startDelayMinutes > 0 ? "+" : ""}
                    {formatMinutes(Math.abs(job.startDelayMinutes))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        </DialogBody>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {job.status === "SCHEDULED" || job.status === "CANCELLED" ? (
              <Button
                variant="ghost"
                icon={Trash2}
                disabled={busy}
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                Eliminar
              </Button>
            ) : null}
            {!locked ? (
              <Button
                variant="ghost"
                icon={Ban}
                disabled={busy}
                onClick={handleCancel}
              >
                Cancelar trabajo
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {!locked ? (
              <Button
                variant="outline"
                icon={Save}
                disabled={busy}
                onClick={handleSave}
              >
                Guardar cambios
              </Button>
            ) : null}
            {next ? (
              <Button
                icon={next.icon}
                disabled={busy}
                onClick={() => handleAdvance(next.action, next.label)}
              >
                {next.label}
              </Button>
            ) : null}
            {job.status === "PRINTING" ? (
              <Button
                variant="outline"
                icon={CheckCircle2}
                disabled={busy}
                onClick={() => handleAdvance("COMPLETE", "Finalizar")}
              >
                Finalizar sin cooldown
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The two facts that now govern a job's placement: the time its area implies
 * on the chosen press, and whether that day still has capacity for it.
 */
function CapacityNote({
  job,
  machine,
  jobs,
  day,
  derivedPrintMinutes,
  printMinutes,
  disabled,
  onUseDerived,
}: {
  job: PrintJob;
  machine: PrintingMachine | null;
  jobs: PrintJob[];
  day: Date | null;
  derivedPrintMinutes: number | null;
  printMinutes: string;
  disabled: boolean;
  onUseDerived: () => void;
}) {
  if (!machine) return null;

  const referenceDay = day ?? new Date(job.scheduledStartAt);
  // This job's own area is excluded so the figure reads as "room besides me".
  const others = jobs.filter((candidate) => candidate.id !== job.id);
  const capacity = dailyCapacityFor(machine, others, referenceDay);
  const fits = job.areaM2 <= capacity.remainingM2 + 0.01;

  const drifted =
    derivedPrintMinutes !== null &&
    clampMinutes(printMinutes, 1) !== derivedPrintMinutes;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Área{" "}
          <strong className="text-foreground">
            {formatArea(job.areaM2)} m²
          </strong>{" "}
          · {formatArea(machine.printSpeedM2PerHour)} m²/h ·{" "}
          {derivedPrintMinutes === null
            ? "—"
            : `calculado ${formatMinutes(derivedPrintMinutes)}`}
        </span>
        {drifted && !disabled ? (
          <Button
            variant="outline"
            sizeVariant="sm"
            icon={Calculator}
            onClick={onUseDerived}
          >
            Usar {formatMinutes(derivedPrintMinutes)}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Capacidad del {formatDay(referenceDay)}
          </span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              fits ? "text-foreground" : "text-destructive",
            )}
          >
            {formatArea(capacity.usedM2 + job.areaM2)} /{" "}
            {formatArea(capacity.limitM2)} m²
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              fits ? "bg-sky-500" : "bg-destructive",
            )}
            style={{
              width: `${Math.min(100, ((capacity.usedM2 + job.areaM2) / Math.max(capacity.limitM2, 0.01)) * 100)}%`,
            }}
          />
        </div>
        {!fits ? (
          <span className="text-[11px] text-destructive">
            Excede la capacidad diaria de {machine.name}.
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MinutesField({
  phase,
  value,
  onChange,
  disabled,
}: {
  phase: keyof typeof PHASE_LABELS;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <Input
      label={
        <span className="flex items-center gap-1.5">
          <span
            className={cn("size-2 rounded-full", PHASE_SWATCHES[phase])}
            aria-hidden
          />
          {PHASE_LABELS[phase]} (min)
        </span>
      }
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(event) => onChange(sanitizeInteger(event.target.value))}
      disabled={disabled}
      className="tabular-nums"
    />
  );
}

function TimeRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xs font-medium tabular-nums">
        {value ? formatDateTime(value) : "—"}
      </dd>
    </div>
  );
}

function ActualRow({
  label,
  actual,
  planned,
}: {
  label: string;
  actual: number | null;
  planned: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xs font-medium tabular-nums">
        {formatMinutes(actual)}
        <span className="text-muted-foreground">
          {" "}
          / {formatMinutes(planned)}
        </span>
      </dd>
    </div>
  );
}
