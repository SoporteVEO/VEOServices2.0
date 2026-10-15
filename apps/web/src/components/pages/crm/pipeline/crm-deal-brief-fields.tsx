"use client";

import type { CrmDealBriefInput, CrmMediaType } from "@/api/crm/crm.types";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/primitives/ui/toggle-group";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { EditFieldShell } from "@/components/ui/edit-field";
import { Input } from "@/components/ui/input";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { calendarDate, toCalendarIso } from "../crm-format";
import {
  MEDIA_TYPE_ICONS,
  MEDIA_TYPE_LABELS,
  MEDIA_TYPE_ORDER,
  OOH_INDUSTRIES,
  SV_DEPARTMENTS,
} from "../crm-ooh-const";

export interface DealBriefState {
  mediaType: CrmMediaType | null;
  brand: string;
  industry: string;
  campaignStart: Date | null;
  campaignEnd: Date | null;
  targetZones: string[];
  agencyCommissionPct: string;
}

export const EMPTY_BRIEF: DealBriefState = {
  mediaType: null,
  brand: "",
  industry: "",
  campaignStart: null,
  campaignEnd: null,
  targetZones: [],
  agencyCommissionPct: "",
};

export function briefFromDeal(deal: {
  mediaType: CrmMediaType | null;
  brand: string | null;
  industry: string | null;
  campaignStart: string | null;
  campaignEnd: string | null;
  targetZones: string[];
  agencyCommissionPct: number | null;
}): DealBriefState {
  return {
    mediaType: deal.mediaType,
    brand: deal.brand ?? "",
    industry: deal.industry ?? "",
    campaignStart: deal.campaignStart ? calendarDate(deal.campaignStart) : null,
    campaignEnd: deal.campaignEnd ? calendarDate(deal.campaignEnd) : null,
    targetZones: deal.targetZones,
    agencyCommissionPct:
      deal.agencyCommissionPct != null ? String(deal.agencyCommissionPct) : "",
  };
}

/** Returns an error message, or the payload when the brief is valid. */
export function briefToInput(
  brief: DealBriefState,
): { error: string } | { input: CrmDealBriefInput } {
  if (brief.campaignStart && brief.campaignEnd && brief.campaignEnd < brief.campaignStart) {
    return { error: "El fin de la campaña debe ser posterior al inicio." };
  }
  const commission =
    brief.agencyCommissionPct.trim() === "" ? null : Number(brief.agencyCommissionPct);
  if (commission != null && (!Number.isFinite(commission) || commission < 0 || commission > 50)) {
    return { error: "La comisión de agencia debe estar entre 0% y 50%." };
  }
  return {
    input: {
      mediaType: brief.mediaType,
      brand: brief.brand.trim() || null,
      industry: brief.industry.trim() || null,
      campaignStart: brief.campaignStart ? toCalendarIso(brief.campaignStart) : null,
      campaignEnd: brief.campaignEnd ? toCalendarIso(brief.campaignEnd) : null,
      targetZones: brief.targetZones,
      agencyCommissionPct: commission,
    },
  };
}

const INDUSTRY_OPTIONS = OOH_INDUSTRIES.map((industry) => ({
  value: industry,
  label: industry,
}));
const ZONE_OPTIONS = SV_DEPARTMENTS.map((zone) => ({ value: zone, label: zone }));

interface Props {
  value: DealBriefState;
  onChange: (patch: Partial<DealBriefState>) => void;
}

export function CrmDealBriefFields({ value, onChange }: Props) {
  const industryOptions =
    value.industry && !OOH_INDUSTRIES.includes(value.industry)
      ? [{ value: value.industry, label: value.industry }, ...INDUSTRY_OPTIONS]
      : INDUSTRY_OPTIONS;

  return (
    <div className="flex flex-col gap-3 border border-border p-3">
      <div>
        <h4 className="text-sm font-semibold">Brief de campaña</h4>
        <p className="text-xs text-muted-foreground">
          El periodo de campaña se usa para revisar disponibilidad y reservar sitios.
        </p>
      </div>

      <EditFieldShell label="Medio">
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={value.mediaType ?? ""}
          onValueChange={(next) => onChange({ mediaType: (next || null) as CrmMediaType | null })}
          className="w-full"
        >
          {MEDIA_TYPE_ORDER.map((type) => {
            const Icon = MEDIA_TYPE_ICONS[type];
            return (
              <ToggleGroupItem
                key={type}
                value={type}
                className="flex-1 gap-1.5 data-[state=on]:bg-accent data-[state=on]:text-foreground"
              >
                <Icon className="size-3.5" />
                {MEDIA_TYPE_LABELS[type]}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </EditFieldShell>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Marca anunciante"
          placeholder="Ej. Pilsener"
          value={value.brand}
          onChange={(e) => onChange({ brand: e.target.value })}
        />
        <Combobox
          label="Categoría (competencia)"
          options={industryOptions}
          value={value.industry || null}
          placeholder="Selecciona categoría"
          onChange={(industry) => onChange({ industry: industry ? String(industry) : "" })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DatePicker
          label="Inicio de campaña"
          allowClear
          value={value.campaignStart}
          onChange={(date) => onChange({ campaignStart: date ?? null })}
        />
        <DatePicker
          label="Fin de campaña"
          allowClear
          value={value.campaignEnd}
          onChange={(date) => onChange({ campaignEnd: date ?? null })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_10rem]">
        <EditFieldShell label="Zonas objetivo">
          <MultiSelectFilter
            label="Departamentos"
            options={ZONE_OPTIONS}
            value={value.targetZones}
            onChange={(targetZones) => onChange({ targetZones })}
            enableSearch
            className="w-full"
          />
        </EditFieldShell>
        <Input
          label="Comisión agencia %"
          type="number"
          min={0}
          max={50}
          step="0.5"
          placeholder="0"
          value={value.agencyCommissionPct}
          onChange={(e) => onChange({ agencyCommissionPct: e.target.value })}
        />
      </div>
    </div>
  );
}
