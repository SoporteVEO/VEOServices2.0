export type FleetServiceType =
  | "PREVENTIVE"
  | "CORRECTIVE"
  | "INSPECTION"
  | "OTHER";

export interface FleetPerson {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

export interface FleetMaintenance {
  id: string;
  vehicleId: string;
  type: FleetServiceType;
  performedAt: string;
  mileageKm: number;
  cost: number;
  description: string;
  workshop: string | null;
  invoiceNumber: string | null;
  nextServiceKm: number | null;
  nextServiceAt: string | null;
  createdBy: FleetPerson | null;
  createdAt: string;
}

export interface FleetVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  notes: string | null;
  photoUrl: string | null;
  archived: boolean;
  initialMileageKm: number | null;
  /** Odometer at the latest logged service, or the initial reading if none. */
  lastMaintenanceKm: number | null;
  lastMaintenanceAt: string | null;
  nextServiceKm: number | null;
  nextServiceAt: string | null;
  serviceCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface FleetVehicleDetail extends FleetVehicle {
  createdBy: FleetPerson | null;
  services: FleetMaintenance[];
}

export interface FleetVehiclesQuery {
  search?: string;
  includeArchived?: boolean;
}

export interface CreateFleetVehicleInput {
  plate: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  initialMileageKm?: number;
  notes?: string;
  photoBase64?: string;
}

export interface UpdateFleetVehicleInput {
  plate?: string;
  brand?: string;
  model?: string;
  year?: number | null;
  color?: string | null;
  initialMileageKm?: number | null;
  notes?: string | null;
  archived?: boolean;
  photoBase64?: string;
  removePhoto?: boolean;
}

export interface FleetMaintenanceInput {
  type: FleetServiceType;
  performedAt: string;
  mileageKm: number;
  cost: number;
  description: string;
  workshop?: string | null;
  invoiceNumber?: string | null;
  nextServiceKm?: number | null;
  nextServiceAt?: string | null;
}
