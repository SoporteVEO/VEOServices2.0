const ASSETS_BASE = "/brand/report";

export const REPORT_ASSETS = {
  logoLight: `${ASSETS_BASE}/veo-logo-light.png`,
  logoDark: `${ASSETS_BASE}/veo-logo-dark.png`,
  isotipoLime: `${ASSETS_BASE}/veo-isotipo-lime.png`,
  icon: (name: string) => `${ASSETS_BASE}/icons/${name}.png`,
} as const;

/** Intrinsic width / height of the logotipo and isotipo PNGs. */
export const LOGO_RATIO = 306 / 63;
export const ISOTIPO_RATIO = 1107 / 579;

export interface ReportStat {
  value: string;
  label: string;
}

export const EXPERIENCE_HIGHLIGHT: ReportStat = {
  value: "+15",
  label: "años de experiencia",
};

export const EXPERIENCE_STATS: ReportStat[][] = [
  [
    { value: "+400", label: "vallas" },
    { value: "+10.000 m²", label: "en espacios" },
  ],
  [
    { value: "+65K", label: "campañas anuales" },
    { value: "+4M", label: "impactos diarios" },
  ],
  [{ value: "+30", label: "municipios" }],
];

export const REPORT_FORMATS = [
  { icon: "15-small-board", name: "Mini valla", size: "4,00 × 3,60 m" },
  { icon: "13-twin-leg", name: "Valla estándar", size: "9,00 × 3,00 m" },
  { icon: "16-lit-board", name: "Mega valla", size: "9,00 × 6,00 m" },
  { icon: "21-square-sign", name: "Torre", size: "4,00 × 8,00 m" },
  { icon: "12-unipole", name: "Unipolar", size: "15,00 × 5,00 m" },
  { icon: "24-overpass", name: "Pasarela", size: "15,00 × 2,00 m" },
  { icon: "11-bridge-board", name: "Portal", size: "15,00 × 2,00 m" },
];

export const REPORT_BENEFITS = [
  "Elaboración de artes",
  "Estrategia de marketing",
  "Pantallas de última generación en formatos de 63 m²",
  "Cobertura de las arterias con mayor tráfico en San Salvador",
  "Su campaña visible en tiempo récord",
  "Evidencia de pauta en cada reporte",
  "Mantenimiento de cada ubicación en excelentes condiciones",
];
