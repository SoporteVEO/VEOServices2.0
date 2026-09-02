"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useCreatePrintingMachine,
  useUpdatePrintingMachine,
} from "@/api/printing/printing.mutations";
import { computePrintMinutes } from "@/api/printing/printing.print-time";
import type { PrintingMachine } from "@/api/printing/printing.types";
import { Switch } from "@/components/primitives/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PRINT_STANDARDS,
  clampDecimal,
  clampMinutes,
  formatArea,
  formatMinutes,
  sanitizeDecimal,
  sanitizeInteger,
} from "./printing-calendar-utils";

type Props = {
  machines: PrintingMachine[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MAX_SPEED_M2_PER_HOUR = 5000;
const MAX_DAILY_CAPACITY_M2 = 100000;

export function PrintingSettingsDialog({
  machines,
  open,
  onOpenChange,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            Configuración de impresión
          </DialogTitle>
          <DialogDescription>
            Renombra las máquinas y ajusta su velocidad, capacidad diaria y
            tiempos por defecto. El tiempo de impresión se calcula con la
            velocidad de cada máquina.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Tabs defaultValue="machines">
            <TabsList>
              <TabsTrigger value="machines">Máquinas</TabsTrigger>
              <TabsTrigger value="standards">Estándares</TabsTrigger>
            </TabsList>

            <TabsContent value="machines" className="flex flex-col gap-3">
              {machines.map((machine) => (
                <MachineRow key={machine.id} machine={machine} />
              ))}
              <NewMachineRow />
            </TabsContent>

            <TabsContent value="standards">
              <StandardsTable machines={machines} />
            </TabsContent>
          </Tabs>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function MachineRow({ machine }: { machine: PrintingMachine }) {
  const [name, setName] = useState(machine.name);
  const [setupMinutes, setSetupMinutes] = useState(String(machine.setupMinutes));
  const [cooldownMinutes, setCooldownMinutes] = useState(
    String(machine.cooldownMinutes),
  );
  const [speed, setSpeed] = useState(String(machine.printSpeedM2PerHour));
  const [capacity, setCapacity] = useState(String(machine.dailyCapacityM2));
  const update = useUpdatePrintingMachine();

  const setup = clampMinutes(setupMinutes, 0, 480);
  const cooldown = clampMinutes(cooldownMinutes, 0, 480);
  const speedValue = clampDecimal(speed, 0.1, MAX_SPEED_M2_PER_HOUR);
  const capacityValue = clampDecimal(capacity, 0.1, MAX_DAILY_CAPACITY_M2);

  const isDirty =
    name !== machine.name ||
    setup !== machine.setupMinutes ||
    cooldown !== machine.cooldownMinutes ||
    speedValue !== machine.printSpeedM2PerHour ||
    capacityValue !== machine.dailyCapacityM2;

  /** Hours of printing the capacity allows at the entered speed. */
  const capacityHours = speedValue > 0 ? capacityValue / speedValue : 0;

  async function handleSave() {
    if (!name.trim()) {
      toast.error("El nombre de la máquina no puede estar vacío.");
      return;
    }
    try {
      await update.mutateAsync({
        machineId: machine.id,
        name: name.trim(),
        setupMinutes: setup,
        cooldownMinutes: cooldown,
        printSpeedM2PerHour: speedValue,
        dailyCapacityM2: capacityValue,
      });
      toast.success("Máquina actualizada.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo actualizar la máquina.",
      );
    }
  }

  async function handleToggleActive(isActive: boolean) {
    try {
      await update.mutateAsync({ machineId: machine.id, isActive });
      toast.success(isActive ? "Máquina activada." : "Máquina desactivada.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo actualizar la máquina.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <Input
        label="Nombre"
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={update.isPending}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Velocidad (m² / hora)"
          type="text"
          inputMode="decimal"
          value={speed}
          onChange={(event) => setSpeed(sanitizeDecimal(event.target.value))}
          disabled={update.isPending}
          className="tabular-nums"
        />
        <Input
          label="Capacidad diaria (m²)"
          type="text"
          inputMode="decimal"
          value={capacity}
          onChange={(event) => setCapacity(sanitizeDecimal(event.target.value))}
          disabled={update.isPending}
          className="tabular-nums"
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        {formatArea(capacityValue)} m² a {formatArea(speedValue)} m²/h equivalen
        a {formatMinutes(Math.round(capacityHours * 60))} de impresión por día.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Set up (min)"
          type="text"
          inputMode="numeric"
          value={setupMinutes}
          onChange={(event) =>
            setSetupMinutes(sanitizeInteger(event.target.value))
          }
          disabled={update.isPending}
          className="tabular-nums"
        />
        <Input
          label="Cooldown (min)"
          type="text"
          inputMode="numeric"
          value={cooldownMinutes}
          onChange={(event) =>
            setCooldownMinutes(sanitizeInteger(event.target.value))
          }
          disabled={update.isPending}
          className="tabular-nums"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Switch
            checked={machine.isActive}
            onCheckedChange={handleToggleActive}
            disabled={update.isPending}
          />
          {machine.isActive ? "Activa" : "Desactivada"}
        </label>
        <Button
          sizeVariant="sm"
          icon={Check}
          disabled={!isDirty || update.isPending}
          onClick={handleSave}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}

function NewMachineRow() {
  const [name, setName] = useState("");
  const create = useCreatePrintingMachine();

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name: name.trim() });
      setName("");
      toast.success("Máquina agregada.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo agregar la máquina.",
      );
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-lg border border-dashed p-3">
      <Input
        label="Nueva máquina"
        placeholder="Máquina 3"
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={create.isPending}
      />
      <Button
        icon={Plus}
        disabled={!name.trim() || create.isPending}
        onClick={handleCreate}
      >
        Agregar
      </Button>
    </div>
  );
}

/**
 * The shop's standard panel sizes priced in press time, so a change to a
 * machine's speed can be sanity-checked against familiar figures.
 */
function StandardsTable({ machines }: { machines: PrintingMachine[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Tiempo de impresión calculado para cada medida estándar. No incluye set
        up ni cooldown.
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-2 py-2 text-left font-medium">Tipo</th>
              <th className="px-2 py-2 text-right font-medium">Medida</th>
              <th className="px-2 py-2 text-right font-medium">m²</th>
              {machines.map((machine) => (
                <th
                  key={machine.id}
                  className="px-2 py-2 text-right font-medium"
                >
                  {machine.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRINT_STANDARDS.map((standard) => {
              const areaM2 = standard.width * standard.height;
              return (
                <tr key={standard.label} className="border-t">
                  <td className="px-2 py-1.5">{standard.label}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                    {standard.width} × {standard.height} m
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatArea(areaM2)}
                  </td>
                  {machines.map((machine) => (
                    <td
                      key={machine.id}
                      className="px-2 py-1.5 text-right tabular-nums"
                    >
                      {formatMinutes(
                        computePrintMinutes(
                          areaM2,
                          machine.printSpeedM2PerHour,
                        ),
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
