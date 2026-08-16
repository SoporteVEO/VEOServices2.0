import type { ProductionOrderStatus } from "@/api/production-orders/production-orders.types";

export interface InstallationTaskPerson {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

export interface InstallationTaskImage {
  id: string;
  url: string;
  createdAt: string;
}

export interface InstallationTaskListItem {
  id: string;
  status: ProductionOrderStatus;
  offerNumber: string;
  customerName: string;
  customerCompany: string | null;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  scheduledInstallationAt: string | null;
  installedAt: string | null;
  hasVulcanizadoImage: boolean;
  installationImageCount: number;
}

export interface InstallationTask extends InstallationTaskListItem {
  advisorFullName: string | null;
  reference: string | null;
  width: number | null;
  height: number | null;
  latitude: number | null;
  longitude: number | null;
  assignedInstaller: InstallationTaskPerson | null;
  vulcanizadoImageUrl: string | null;
  installationImages: InstallationTaskImage[];
}

export type InstallationImageKind = "VULCANIZADO" | "INSTALLATION";
