import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Absence } from "./absences.types";

export async function getMyAbsences() {
  const response = await apiFetch<{ data: Absence[] }>("/me/absences");
  return response.data;
}

export async function getAllAbsences() {
  const response = await apiFetch<{ data: Absence[] }>("/absences");
  return response.data;
}

export function useMyAbsences() {
  return useQuery({
    queryKey: ["absences", "mine"],
    queryFn: getMyAbsences,
  });
}

export function useAllAbsences() {
  return useQuery({
    queryKey: ["absences", "all"],
    queryFn: getAllAbsences,
  });
}
