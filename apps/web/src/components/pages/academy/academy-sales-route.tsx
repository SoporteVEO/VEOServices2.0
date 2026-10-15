import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { academyArticlePath } from "./academy-links";

const SALES_STEPS = [
  {
    title: "Registra el negocio",
    detail: "Brief y disponibilidad en el CRM",
    href: academyArticlePath("crm-sitios-y-reservas"),
  },
  {
    title: "Crea la cotización",
    detail: "Vallas, pantallas y conceptos",
    href: academyArticlePath("crear-cotizacion-vallas"),
  },
  {
    title: "Contrato en Brilo",
    detail: "Cliente, caras, fechas y posteo",
    href: academyArticlePath("contrato-en-brilo"),
  },
  {
    title: "Acepta la cotización",
    detail: "Vincula el contrato y descarga el PDF",
    href: academyArticlePath("aceptar-cotizacion"),
  },
  {
    title: "Envía a firma",
    detail: "El cliente firma el contrato",
    href: academyArticlePath("enviar-contrato-firma"),
  },
  {
    title: "Producción e instalación",
    detail: "Arte, lona, instalación y campaña",
    href: academyArticlePath("despues-de-la-venta"),
  },
  {
    title: "Reporta al cliente",
    detail: "Fotos y reporte mensual",
    href: academyArticlePath("enviar-reporte"),
  },
  {
    title: "Renueva",
    detail: "Antes de que termine el contrato",
    href: academyArticlePath("crm-renovaciones"),
  },
];

export function AcademySalesRoute() {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            La ruta de una venta
          </h2>
          <p className="text-sm text-muted-foreground">
            Haz clic en cualquier paso para ver cómo se hace.
          </p>
        </div>
        <Link
          href={academyArticlePath("proceso-de-venta")}
          className="flex items-center gap-1 text-sm font-medium text-info hover:underline"
        >
          Ver el proceso completo
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <ol className="mt-4 grid gap-2 @xl/main:grid-cols-2 @4xl/main:grid-cols-4">
        {SALES_STEPS.map((step, index) => (
          <li key={step.title}>
            <Link
              href={step.href}
              className="group flex h-full items-start gap-3 rounded-md border border-border p-3 transition-colors hover:border-veo-lime hover:bg-veo-lime/5"
            >
              <span className="flex size-7 shrink-0 items-center justify-center bg-veo-dark font-mono text-xs font-semibold text-white dark:bg-veo-ice dark:text-veo-dark">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold group-hover:underline">
                  {step.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {step.detail}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
