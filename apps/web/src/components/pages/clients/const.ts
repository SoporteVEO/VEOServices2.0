import type {
  ClientContractStatus,
  ClientType,
} from "@/api/clients/clients.types";

export const CLIENT_TYPE_ORDER: ClientType[] = ["DIRECT", "AGENCY"];

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  DIRECT: "Directo",
  AGENCY: "Agencia",
};

export const CLIENT_TYPE_DESCRIPTIONS: Record<ClientType, string> = {
  DIRECT: "Anunciante que contrata directamente con VEO.",
  AGENCY: "Agencia que revende espacios OOH/DOOH a sus propios clientes.",
};

export const CLIENT_TYPE_STYLES: Record<ClientType, string> = {
  DIRECT: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  AGENCY:
    "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

export const CLIENT_CONTRACT_STATUS_LABELS: Record<
  ClientContractStatus,
  string
> = {
  ACTIVE: "Vigente",
  UPCOMING: "Próximo",
  FINISHED: "Finalizado",
};

export const CLIENT_CONTRACT_STATUS_STYLES: Record<
  ClientContractStatus,
  string
> = {
  ACTIVE:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  UPCOMING:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  FINISHED: "border-border bg-muted/40 text-muted-foreground",
};
