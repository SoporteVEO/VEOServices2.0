"use client";

import { createContext, useContext } from "react";
import type { PantallasBoard, PantallasLog } from "@/api/pantallas/pantallas.types";

export type PantallasDialogState =
  | { type: "campaign"; sublistId: string; campaignId: string | null }
  | { type: "campaignDetail"; campaignId: string }
  | { type: "deleteCampaign"; campaignId: string }
  | { type: "attentionDelete"; groupKey: string }
  | { type: "sublist"; sublistId: string }
  | { type: "screen"; screenId: string | null }
  | { type: "order" }
  | { type: "report" }
  | null;

export interface PantallasContextValue {
  board: PantallasBoard;
  logs: PantallasLog[];
  refDate: string;
  canEdit: boolean;
  openDialog: (dialog: PantallasDialogState) => void;
  goToScreen: (screenId: string) => void;
}

const PantallasContext = createContext<PantallasContextValue | null>(null);

export const PantallasProvider = PantallasContext.Provider;

export function usePantallas() {
  const value = useContext(PantallasContext);
  if (!value) throw new Error("usePantallas must be used inside PantallasProvider");
  return value;
}
