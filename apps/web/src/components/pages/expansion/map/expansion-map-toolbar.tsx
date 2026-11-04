"use client";

import {
  Box,
  CalendarRange,
  Layers,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Moon,
  Mountain,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Satellite,
  Scan,
  Waypoints,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/primitives/ui/popover";
import { Switch } from "@/components/primitives/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/primitives/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/primitives/ui/tooltip";
import { useMap } from "@/components/primitives/ui/map";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BASE_LAYERS,
  BASE_LAYER_ORDER,
  COLOR_MODE_LABELS,
  COVERAGE_RADIUS_OPTIONS,
  LAYER_LABELS,
  formatDistance,
  type BaseLayer,
  type ColorMode,
  type MapLayers,
} from "../expansion-const";
import { pointsBounds, type MappedBillboard } from "../expansion-analysis";
import { FIT_OPTIONS } from "./expansion-map-events";

const BASE_LAYER_ICONS: Record<BaseLayer, LucideIcon> = {
  streets: MapIcon,
  satellite: Satellite,
  hybrid: Waypoints,
  terrain: Mountain,
  dark: Moon,
};

const PANEL_CLASS =
  "pointer-events-auto rounded-lg border bg-background/95 shadow-md backdrop-blur-sm";

const CONTROL_HEIGHT = "h-9.5";

const TRAILING_PERIOD = "trailing";

export interface ToolbarState {
  baseLayer: BaseLayer;
  colorMode: ColorMode;
  layers: MapLayers;
  coverageRadius: number;
  year: number | null;
}

export function ExpansionMapToolbar({
  state,
  onChange,
  years,
}: {
  state: ToolbarState;
  onChange: (patch: Partial<ToolbarState>) => void;
  years: number[];
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-start gap-2">
      <ToggleGroup
        type="single"
        size="sm"
        spacing={0}
        value={state.baseLayer}
        onValueChange={(value) => value && onChange({ baseLayer: value as BaseLayer })}
        className={cn(PANEL_CLASS, CONTROL_HEIGHT, "items-center px-1")}
      >
        {BASE_LAYER_ORDER.map((layer) => {
          const Icon = BASE_LAYER_ICONS[layer];
          return (
            <ToggleGroupItem
              key={layer}
              value={layer}
              aria-label={BASE_LAYERS[layer].label}
              title={BASE_LAYERS[layer].label}
            >
              <Icon />
              <span className="hidden @5xl:inline">{BASE_LAYERS[layer].label}</span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      <LayersPopover state={state} onChange={onChange} />

      <div className={cn(PANEL_CLASS, CONTROL_HEIGHT, "flex items-center")}>
        <Select
          value={state.year == null ? TRAILING_PERIOD : String(state.year)}
          onValueChange={(value) =>
            onChange({ year: value === TRAILING_PERIOD ? null : Number(value) })
          }
        >
          <SelectTrigger
            sizeVariant="sm"
            aria-label="Período"
            className="h-full w-auto gap-1.5 border-0 bg-transparent shadow-none"
          >
            <CalendarRange className="size-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TRAILING_PERIOD}>Últimos 12 meses</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                Año {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function LayersPopover({
  state,
  onChange,
}: {
  state: ToolbarState;
  onChange: (patch: Partial<ToolbarState>) => void;
}) {
  const activeCount = Object.values(state.layers).filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          sizeVariant="md"
          icon={Layers}
          aria-label="Capas"
          className={cn(PANEL_CLASS, CONTROL_HEIGHT)}
        >
          <span className="hidden @2xl:inline">Capas</span>
          <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums">{activeCount}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="flex flex-col gap-2 border-b p-3">
          <span className="text-xs font-semibold text-muted-foreground">Colorear vallas por</span>
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            spacing={0}
            value={state.colorMode}
            onValueChange={(value) => value && onChange({ colorMode: value as ColorMode })}
            className="w-full"
          >
            {(Object.keys(COLOR_MODE_LABELS) as ColorMode[]).map((mode) => (
              <ToggleGroupItem key={mode} value={mode} className="flex-1">
                {COLOR_MODE_LABELS[mode]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <ul className="flex flex-col p-1">
          {(Object.keys(LAYER_LABELS) as (keyof MapLayers)[]).map((key) => (
            <li key={key}>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/60">
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{LAYER_LABELS[key].label}</span>
                  <span className="text-xs text-muted-foreground">
                    {LAYER_LABELS[key].description}
                  </span>
                </span>
                <Switch
                  size="sm"
                  checked={state.layers[key]}
                  disabled={key === "clusters" && !state.layers.billboards}
                  onCheckedChange={(checked) =>
                    onChange({ layers: { ...state.layers, [key]: checked } })
                  }
                />
              </label>
              {key === "coverage" && state.layers.coverage ? (
                <div className="px-2 pb-2">
                  <ToggleGroup
                    type="single"
                    size="sm"
                    variant="outline"
                    spacing={0}
                    value={String(state.coverageRadius)}
                    onValueChange={(value) => value && onChange({ coverageRadius: Number(value) })}
                    className="w-full"
                  >
                    {COVERAGE_RADIUS_OPTIONS.map((meters) => (
                      <ToggleGroupItem key={meters} value={String(meters)} className="flex-1">
                        {formatDistance(meters / 1000)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function IconAction({
  label,
  icon: Icon,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          sizeVariant="sm"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onClick={onClick}
          className={cn("w-8 px-0", active && "bg-muted")}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ExpansionMapActions({
  billboards,
  placing,
  onTogglePlacing,
  expanded,
  onToggleExpanded,
  panelOpen,
  onTogglePanel,
}: {
  billboards: MappedBillboard[];
  placing: boolean;
  onTogglePlacing: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
}) {
  const { map } = useMap();
  const [tilted, setTilted] = useState(false);
  const bounds = pointsBounds(billboards);

  function toggleTilt() {
    const next = !tilted;
    setTilted(next);
    map?.easeTo({ pitch: next ? 55 : 0, bearing: next ? -20 : 0, duration: 800 });
  }

  return (
    <div className="ml-auto flex shrink-0 items-start gap-2">
      <Button
        sizeVariant="md"
        icon={placing ? X : Plus}
        variant={placing ? "outline" : "default"}
        aria-label={placing ? "Cancelar" : "Nueva ubicación"}
        className={cn("pointer-events-auto shadow-md", CONTROL_HEIGHT)}
        onClick={onTogglePlacing}
      >
        <span className="hidden @3xl:inline">{placing ? "Cancelar" : "Nueva ubicación"}</span>
      </Button>
      <div className={cn(PANEL_CLASS, CONTROL_HEIGHT, "flex items-center px-0.5")}>
        <IconAction
          label="Ver todas las vallas"
          icon={Scan}
          disabled={!bounds}
          onClick={() => bounds && map?.fitBounds(bounds, FIT_OPTIONS)}
        />
        <IconAction label="Vista 3D" icon={Box} active={tilted} onClick={toggleTilt} />
        <IconAction
          label={panelOpen ? "Ocultar panel" : "Mostrar panel"}
          icon={panelOpen ? PanelRightClose : PanelRightOpen}
          onClick={onTogglePanel}
        />
        <IconAction
          label={expanded ? "Salir de pantalla completa" : "Pantalla completa"}
          icon={expanded ? Minimize2 : Maximize2}
          active={expanded}
          onClick={onToggleExpanded}
        />
      </div>
    </div>
  );
}
