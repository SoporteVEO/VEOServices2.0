"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { usePantallas } from "./pantallas-context";
import { localIsoDate, parseIso } from "./pantallas-format";
import { versionStatus, versionsSummary } from "./pantallas-logic";
import { VersionStatusBadge } from "./tone-badge";

export interface VersionRow {
  key: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
}

export function newVersionRow(startDate: string | null): VersionRow {
  return { key: crypto.randomUUID(), title: "", startDate, endDate: null };
}

export function CampaignVersionsEditor({
  rows,
  onChange,
  defaultStartDate,
}: {
  rows: VersionRow[];
  onChange: (rows: VersionRow[]) => void;
  defaultStartDate: string | null;
}) {
  const { refDate } = usePantallas();
  const filled = rows.filter((r) => r.title || r.startDate || r.endDate);
  const summary = versionsSummary(filled, refDate);

  function update(key: string, patch: Partial<VersionRow>) {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">Versiones del arte</p>
      {rows.map((row) => (
        <div key={row.key} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
          <div className="min-w-40 flex-1">
            <Input
              placeholder="Nombre del arte"
              value={row.title}
              onChange={(e) => update(row.key, { title: e.target.value })}
            />
          </div>
          <DatePicker
            className="w-36"
            placeholder="Inicio"
            allowClear
            value={parseIso(row.startDate)}
            onChange={(d) => update(row.key, { startDate: d ? localIsoDate(d) : null })}
          />
          <span className="text-muted-foreground">→</span>
          <DatePicker
            className="w-36"
            placeholder="Fin"
            allowClear
            value={parseIso(row.endDate)}
            onChange={(d) => update(row.key, { endDate: d ? localIsoDate(d) : null })}
          />
          <VersionStatusBadge status={versionStatus(row, refDate)} />
          <Button
            type="button"
            variant="ghost"
            sizeVariant="sm"
            className="border-0 text-red-600 shadow-none"
            icon={X}
            title="Eliminar versión"
            onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
          />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          sizeVariant="sm"
          icon={Plus}
          onClick={() => onChange([...rows, newVersionRow(defaultStartDate)])}
        >
          Agregar versión
        </Button>
        <span className="text-xs text-muted-foreground">
          {rows.length
            ? summary
              ? `${summary.total} ${summary.total === 1 ? "versión" : "versiones"} · ${summary.detail}`
              : ""
            : "Sin versiones. Úsalas cuando un mismo cliente tiene varios artes con vigencias distintas."}
        </span>
      </div>
    </div>
  );
}
