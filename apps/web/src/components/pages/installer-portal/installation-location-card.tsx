"use client";

import { MapPin, Navigation } from "lucide-react";
import type { InstallationTask } from "@/api/installations/installations.types";
import { Button } from "@/components/primitives/ui/button";
import { googleMapsUrl, openStreetMapEmbedUrl } from "@/lib/installer-portal";

export function InstallationLocationCard({ task }: { task: InstallationTask }) {
  const address =
    [task.address, task.cityName, task.departmentName]
      .filter(Boolean)
      .join(", ") || "Dirección no disponible";

  const hasCoordinates = task.latitude != null && task.longitude != null;
  const mapsHref = googleMapsUrl(task.latitude, task.longitude, address);

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-start gap-3 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MapPin className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-tight">
            Ubicación de la valla
          </h2>
          <p className="pt-0.5 text-sm text-foreground/90">{address}</p>
          {task.reference ? (
            <p className="pt-1 text-xs text-muted-foreground">
              Referencia: {task.reference}
            </p>
          ) : null}
        </div>
      </div>

      {hasCoordinates ? (
        <iframe
          title="Mapa de la ubicación"
          className="block h-56 w-full border-y bg-muted"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={openStreetMapEmbedUrl(task.latitude!, task.longitude!)}
        />
      ) : (
        <div className="border-y bg-muted/50 px-4 py-6 text-center text-xs text-muted-foreground">
          No hay coordenadas registradas para esta valla.
        </div>
      )}

      <div className="p-4">
        {mapsHref ? (
          <Button asChild className="h-11 w-full">
            <a href={mapsHref} target="_blank" rel="noopener noreferrer">
              <Navigation aria-hidden />
              Abrir en Google Maps
            </a>
          </Button>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Sin datos suficientes para abrir el mapa.
          </p>
        )}
      </div>
    </section>
  );
}
