import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  FleetVehicle,
  FleetVehicleDetail,
  FleetVehiclesQuery,
} from "./fleet.types";

const STALE_TIME = 30 * 1000;

export const fleetKeys = {
  all: ["fleet"] as const,
  vehicles: (query: FleetVehiclesQuery) =>
    ["fleet", "vehicles", query] as const,
  vehicle: (id: string | null) => ["fleet", "vehicle", id] as const,
};

export async function getFleetVehicles(
  query: FleetVehiclesQuery,
): Promise<FleetVehicle[]> {
  const params: Record<string, string> = {};
  if (query.search) params.search = query.search;
  if (query.includeArchived) params.includeArchived = "true";

  const response = await apiFetch<{ data: FleetVehicle[] }>(
    "/fleet/vehicles",
    { query: params },
  );
  return response.data;
}

export function useFleetVehicles(query: FleetVehiclesQuery) {
  return useQuery({
    queryKey: fleetKeys.vehicles(query),
    queryFn: () => getFleetVehicles(query),
    staleTime: STALE_TIME,
  });
}

export async function getFleetVehicle(id: string): Promise<FleetVehicleDetail> {
  const response = await apiFetch<{ data: FleetVehicleDetail }>(
    `/fleet/vehicles/${id}`,
  );
  return response.data;
}

export function useFleetVehicle(id: string | null) {
  return useQuery({
    queryKey: fleetKeys.vehicle(id),
    queryFn: () => getFleetVehicle(id as string),
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}
