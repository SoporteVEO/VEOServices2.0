"use client";

import { ProductionOrdersTable } from "./production-orders-table";

export function ProductionPage() {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="flex shrink-0 flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Producción</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona el estado de las órdenes de producción por valla estática y
          consulta los documentos cargados por el vendedor.
        </p>
      </header>
      <ProductionOrdersTable />
    </section>
  );
}
