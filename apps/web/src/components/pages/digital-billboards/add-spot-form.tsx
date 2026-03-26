"use client";

import { useCreateDigitalBillboardSpot } from "@/api/digital-billboards/digital-billboards.spots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormEvent } from "react";

export function AddSpotForm({
  billboardId,
  selectedDay,
  maxSpots,
  onSuccess,
}: {
  billboardId: string;
  selectedDay: Date;
  maxSpots: number;
  onSuccess?: () => void;
}) {
  const createMutation = useCreateDigitalBillboardSpot({
    billboardId,
    onSuccess,
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const str = (key: string) => {
      const v = fd.get(key);
      return typeof v === "string" && v.trim() ? v : null;
    };
    createMutation.mutate({
      timestamp: selectedDay.toISOString(),
      duration: Number(fd.get("duration")),
      campaignName: str("campaignName"),
      campaignDescription: str("campaignDescription"),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Duración (spots)"
        name="duration"
        min={1}
        max={maxSpots}
        required
      />
      <Input label="Campaña (opcional)" name="campaignName" />
      <Textarea label="Descripción (opcional)" name="campaignDescription" />
      <Button
        type="submit"
        className="w-full"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? "Guardando..." : "Guardar"}
      </Button>
      {createMutation.error && (
        <p className="text-sm text-destructive">
          {createMutation.error.message}
        </p>
      )}
    </form>
  );
}
