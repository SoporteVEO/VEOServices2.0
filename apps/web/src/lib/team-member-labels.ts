import type { ContractType, TeamMemberStatus } from "@/api/team-members/team-members.types";

export const CONTRACT_TYPES: ContractType[] = [
  "FULL_TIME",
  "TEMPORAL",
  "FREELANCE",
  "PART_TIME",
  "INTERNSHIP",
  "PROFESSIONAL_SERVICES",
];

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  FULL_TIME: "Tiempo completo",
  TEMPORAL: "Temporal",
  FREELANCE: "Freelance",
  PART_TIME: "Medio tiempo",
  INTERNSHIP: "Pasantía",
  PROFESSIONAL_SERVICES: "Servicios profesionales",
};

export const STATUSES: TeamMemberStatus[] = ["ACTIVE", "INACTIVE", "TERMINATED"];

export const STATUS_LABELS: Record<TeamMemberStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  TERMINATED: "Terminado",
};
