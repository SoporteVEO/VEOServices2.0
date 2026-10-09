import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { fleetKeys } from "./fleet.get";
import type {
  CreateFleetVehicleInput,
  FleetMaintenanceInput,
  FleetVehicleDetail,
  UpdateFleetVehicleInput,
} from "./fleet.types";

type QueryClient = ReturnType<typeof useQueryClient>;

/**
 * Every vehicle and service mutation answers with the refreshed vehicle, so we
 * seed its detail cache and let the list recompute its derived figures.
 */
function syncVehicleCaches(
  queryClient: QueryClient,
  vehicle: FleetVehicleDetail,
) {
  queryClient.setQueryData(fleetKeys.vehicle(vehicle.id), vehicle);
  void queryClient.invalidateQueries({ queryKey: ["fleet", "vehicles"] });
}

export function useCreateFleetVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateFleetVehicleInput) => {
      const response = await apiFetch<{ data: FleetVehicleDetail }>(
        "/fleet/vehicles",
        { method: "POST", body: JSON.stringify(input) },
      );
      return response.data;
    },
    onSuccess: (vehicle) => syncVehicleCaches(queryClient, vehicle),
  });
}

export function useUpdateFleetVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: { id: string } & UpdateFleetVehicleInput) => {
      const response = await apiFetch<{ data: FleetVehicleDetail }>(
        `/fleet/vehicles/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
      );
      return response.data;
    },
    onSuccess: (vehicle) => syncVehicleCaches(queryClient, vehicle),
  });
}

export function useDeleteFleetVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string }) =>
      apiFetch<{ deleted: boolean }>(`/fleet/vehicles/${input.id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: fleetKeys.all }),
  });
}

export function useCreateFleetMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      vehicleId,
      ...body
    }: { vehicleId: string } & FleetMaintenanceInput) => {
      const response = await apiFetch<{ data: FleetVehicleDetail }>(
        `/fleet/vehicles/${vehicleId}/maintenances`,
        { method: "POST", body: JSON.stringify(body) },
      );
      return response.data;
    },
    onSuccess: (vehicle) => syncVehicleCaches(queryClient, vehicle),
  });
}

export function useUpdateFleetMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: { id: string } & Partial<FleetMaintenanceInput>) => {
      const response = await apiFetch<{ data: FleetVehicleDetail }>(
        `/fleet/maintenances/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
      );
      return response.data;
    },
    onSuccess: (vehicle) => syncVehicleCaches(queryClient, vehicle),
  });
}

export function useDeleteFleetMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string }) => {
      const response = await apiFetch<{ data: FleetVehicleDetail }>(
        `/fleet/maintenances/${input.id}`,
        { method: "DELETE" },
      );
      return response.data;
    },
    onSuccess: (vehicle) => syncVehicleCaches(queryClient, vehicle),
  });
}
