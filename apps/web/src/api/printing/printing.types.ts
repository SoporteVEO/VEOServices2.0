export type PrintJobStatus =
  | "SCHEDULED"
  | "SETUP"
  | "PRINTING"
  | "COOLDOWN"
  | "COMPLETED"
  | "CANCELLED";

export type PrintJobAction =
  | "START_SETUP"
  | "START_PRINT"
  | "START_COOLDOWN"
  | "COMPLETE";

export type PrintJobPhase = "SETUP" | "PRINTING" | "COOLDOWN";

export interface PrintingMachine {
  id: string;
  name: string;
  position: number;
  setupMinutes: number;
  cooldownMinutes: number;
  /** Throughput that turns a panel's area into a print duration. */
  printSpeedM2PerHour: number;
  /** Most area that may be scheduled on this press within one day. */
  dailyCapacityM2: number;
  isActive: boolean;
}

export interface PrintJobItem {
  id: string;
  productionOrderId: string;
  status: "RECEIVED" | "IN_PRODUCTION" | "COMPLETED" | "CANCELLED";
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  width: number | null;
  height: number | null;
  quantity: number;
}

export interface PrintJobOrder {
  offerNumber: string;
  customerName: string;
  customerCompany: string | null;
}

export interface PrintJob {
  id: string;
  machineId: string;
  machineName: string;
  status: PrintJobStatus;
  scheduledStartAt: string;
  scheduledEndAt: string;
  setupMinutes: number;
  printMinutes: number;
  cooldownMinutes: number;
  plannedTotalMinutes: number;
  areaM2: number;
  setupStartedAt: string | null;
  printStartedAt: string | null;
  cooldownStartedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  actualSetupMinutes: number | null;
  actualPrintMinutes: number | null;
  actualCooldownMinutes: number | null;
  actualTotalMinutes: number | null;
  startDelayMinutes: number | null;
  notes: string | null;
  updatedAt: string;
  item: PrintJobItem;
  order: PrintJobOrder;
  createdBy: { id: string; firstName: string; lastName: string | null } | null;
}

export interface PrintBacklogItem {
  id: string;
  productionOrderId: string;
  status: "RECEIVED" | "IN_PRODUCTION" | "COMPLETED" | "CANCELLED";
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  width: number | null;
  height: number | null;
  quantity: number;
  offerNumber: string;
  customerName: string;
  customerCompany: string | null;
  areaM2: number;
  createdAt: string;
}
