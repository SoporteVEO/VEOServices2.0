import type { CrmTemplateVariables } from "@/api/crm/crm.types";

export interface TemplateVariable {
  key: string;
  label: string;
  sample: string;
}

export interface TemplateVariableGroup {
  label: string;
  variables: TemplateVariable[];
}

/** Keep the keys in sync with `apps/api/src/modules/crm/crm-template-render.ts`. */
export const TEMPLATE_VARIABLE_GROUPS: TemplateVariableGroup[] = [
  {
    label: "Contacto",
    variables: [
      { key: "contacto.nombre", label: "Nombre", sample: "María" },
      { key: "contacto.apellido", label: "Apellido", sample: "López" },
      {
        key: "contacto.nombre_completo",
        label: "Nombre completo",
        sample: "María López",
      },
      { key: "contacto.cargo", label: "Cargo", sample: "Gerente de Marketing" },
      { key: "contacto.correo", label: "Correo", sample: "maria@empresa.com" },
    ],
  },
  {
    label: "Cliente",
    variables: [
      { key: "cliente.nombre", label: "Nombre", sample: "María López" },
      { key: "cliente.empresa", label: "Empresa", sample: "Empresa S.A. de C.V." },
      { key: "cliente.correo", label: "Correo", sample: "compras@empresa.com" },
    ],
  },
  {
    label: "Negocio",
    variables: [
      { key: "negocio.titulo", label: "Título", sample: "Campaña Navidad 2026" },
      { key: "negocio.valor", label: "Valor", sample: "$12,500.00" },
      { key: "negocio.etapa", label: "Etapa", sample: "Negociación" },
      { key: "negocio.cierre", label: "Cierre estimado", sample: "15 de diciembre de 2026" },
    ],
  },
  {
    label: "Campaña OOH",
    variables: [
      { key: "campana.marca", label: "Marca", sample: "Pilsener" },
      { key: "campana.medio", label: "Medio", sample: "Vallas y pantallas digitales" },
      { key: "campana.inicio", label: "Inicio de campaña", sample: "1 de diciembre de 2026" },
      { key: "campana.fin", label: "Fin de campaña", sample: "31 de diciembre de 2026" },
      { key: "campana.total_sitios", label: "Total de sitios", sample: "3" },
      {
        key: "campana.sitios",
        label: "Listado de sitios",
        sample:
          "- **SS-0142** · Blvd. Los Próceres, San Salvador\n- **SS-0217** · Paseo General Escalón, San Salvador\n- **LED-04** · Pantalla Multiplaza (60 spots/día)",
      },
    ],
  },
  {
    label: "Asesor",
    variables: [
      { key: "asesor.nombre", label: "Nombre", sample: "Carlos" },
      {
        key: "asesor.nombre_completo",
        label: "Nombre completo",
        sample: "Carlos Martínez",
      },
      { key: "asesor.correo", label: "Correo", sample: "carlos@veo.com.sv" },
    ],
  },
  {
    label: "General",
    variables: [{ key: "fecha.hoy", label: "Fecha de hoy", sample: "14 de octubre de 2026" }],
  },
];

export const SAMPLE_VARIABLES: CrmTemplateVariables = Object.fromEntries(
  TEMPLATE_VARIABLE_GROUPS.flatMap((group) =>
    group.variables.map((variable) => [variable.key, variable.sample]),
  ),
);

const VARIABLE_RE = /\{\{\s*([a-zA-Z_][\w.]*)\s*\}\}/g;

export function applyVariables(text: string, vars: CrmTemplateVariables): string {
  return text.replace(VARIABLE_RE, (_match, name: string) => vars[name] ?? "");
}

export function variableToken(key: string): string {
  return `{{${key}}}`;
}
