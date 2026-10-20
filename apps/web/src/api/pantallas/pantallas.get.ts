import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DigitalOrder, PantallasBoard, PantallasLog } from "./pantallas.types";

export const pantallasKeys = {
  all: ["pantallas"] as const,
  board: ["pantallas", "board"] as const,
  logs: ["pantallas", "logs"] as const,
  orders: ["pantallas", "orders"] as const,
};

export async function getPantallasBoard(): Promise<PantallasBoard> {
  const response = await apiFetch<{ data: PantallasBoard }>("/pantallas/board");
  return response.data;
}

export function usePantallasBoard() {
  return useQuery({
    queryKey: pantallasKeys.board,
    queryFn: getPantallasBoard,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export async function getPantallasLogs(): Promise<PantallasLog[]> {
  const response = await apiFetch<{ data: PantallasLog[] }>("/pantallas/logs");
  return response.data;
}

export function usePantallasLogs() {
  return useQuery({
    queryKey: pantallasKeys.logs,
    queryFn: getPantallasLogs,
    staleTime: 30 * 1000,
  });
}

export async function getPantallasOrders(): Promise<DigitalOrder[]> {
  const response = await apiFetch<{ data: DigitalOrder[] }>("/pantallas/ops");
  return response.data;
}

export function usePantallasOrders() {
  return useQuery({
    queryKey: pantallasKeys.orders,
    queryFn: getPantallasOrders,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}
