"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { DetailPanelSkeleton } from "@/components/ui/skeletons";

export function FinanceDrawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      handleOnly
    >
      <DrawerContent className="flex flex-col data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[92vw] data-[vaul-drawer-direction=right]:sm:max-w-[760px]">
        {children}
      </DrawerContent>
    </Drawer>
  );
}

export function FinanceDrawerHeader({
  title,
  description,
  onClose,
}: {
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
}) {
  return (
    <DrawerHeader className="border-b">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <DrawerTitle className="flex flex-wrap items-center gap-2">
            {title}
          </DrawerTitle>
          {description ? (
            <DrawerDescription className="truncate">
              {description}
            </DrawerDescription>
          ) : null}
        </div>
        <PrimitiveButton
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </PrimitiveButton>
      </div>
    </DrawerHeader>
  );
}

export function FinanceDrawerState({
  isLoading,
  isError,
  errorMessage,
}: {
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
}) {
  if (isLoading) return <DetailPanelSkeleton sections={2} />;
  if (!isError) return null;
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">{errorMessage}</p>
    </div>
  );
}

export function FinanceInfoGrid({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11px] font-medium text-muted-foreground">
            {item.label}
          </dt>
          <dd className="truncate text-sm font-medium">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FinanceSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  );
}
