import { addMinutes } from "date-fns";
import { computeJobMinutes } from "@/api/printing/printing.print-time";
import type {
  PrintBacklogItem,
  PrintJob,
  PrintingMachine,
} from "@/api/printing/printing.types";

/**
 * A provisional bar rendered the instant a backlog card is dropped, so the
 * calendar never waits on the round trip. The phase mix mirrors how the server
 * schedules a job - print time derived from the machine's throughput, set up
 * and cooldown from its defaults - so the bar keeps its length once the real
 * job arrives.
 */
export function buildOptimisticPrintJob(
  item: PrintBacklogItem,
  machine: PrintingMachine,
  startAt: Date,
): PrintJob {
  const { setupMinutes, printMinutes, cooldownMinutes } = computeJobMinutes(
    item.areaM2,
    machine,
  );
  const plannedTotalMinutes = setupMinutes + printMinutes + cooldownMinutes;

  return {
    id: `optimistic:${item.id}`,
    machineId: machine.id,
    machineName: machine.name,
    status: "SCHEDULED",
    scheduledStartAt: startAt.toISOString(),
    scheduledEndAt: addMinutes(startAt, plannedTotalMinutes).toISOString(),
    setupMinutes,
    printMinutes,
    cooldownMinutes,
    plannedTotalMinutes,
    areaM2: item.areaM2,
    setupStartedAt: null,
    printStartedAt: null,
    cooldownStartedAt: null,
    completedAt: null,
    cancelledAt: null,
    actualSetupMinutes: null,
    actualPrintMinutes: null,
    actualCooldownMinutes: null,
    actualTotalMinutes: null,
    startDelayMinutes: null,
    notes: null,
    updatedAt: new Date().toISOString(),
    item: {
      id: item.id,
      productionOrderId: item.productionOrderId,
      status: item.status,
      billboardCode: item.billboardCode,
      address: item.address,
      cityName: item.cityName,
      departmentName: item.departmentName,
      width: item.width,
      height: item.height,
      quantity: item.quantity,
    },
    order: {
      offerNumber: item.offerNumber,
      customerName: item.customerName,
      customerCompany: item.customerCompany,
    },
    createdBy: null,
  };
}
