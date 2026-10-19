"use client";

import { useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 240;
const STROKE_WIDTH = 3.5;
const STROKE_COLOR = "#111827";

type Point = { x: number; y: number };

type SignaturePadProps = {
  /** Receives a PNG data URL once a stroke ends, or null after clearing. */
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
  className?: string;
};

/** The exported PNG gets a white background so it reads the same on any theme. */
function exportPng(source: HTMLCanvasElement): string {
  const flat = document.createElement("canvas");
  flat.width = source.width;
  flat.height = source.height;
  const context = flat.getContext("2d");
  if (!context) return source.toDataURL("image/png");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, flat.width, flat.height);
  context.drawImage(source, 0, 0);
  return flat.toDataURL("image/png");
}

export function SignaturePad({
  onChange,
  disabled = false,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<Point | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  function toCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
  }

  function drawSegment(canvas: HTMLCanvasElement, from: Point, to: Point) {
    const context = canvas.getContext("2d");
    if (!context) return;
    context.strokeStyle = STROKE_COLOR;
    context.lineWidth = STROKE_WIDTH;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = toCanvasPoint(event);
    lastPointRef.current = point;
    drawSegment(event.currentTarget, point, point);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const last = lastPointRef.current;
    if (!last) return;
    const point = toCanvasPoint(event);
    drawSegment(event.currentTarget, last, point);
    lastPointRef.current = point;
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!lastPointRef.current) return;
    lastPointRef.current = null;
    setIsEmpty(false);
    onChange(exportPng(event.currentTarget));
  }

  function handleClear() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange(null);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative border border-border-strong bg-white">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          aria-label="Área de firma"
          className={cn(
            "block aspect-[3/1] w-full touch-none",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair",
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        />
        {isEmpty ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
            Firma aquí con el mouse o con el dedo
          </span>
        ) : null}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 bottom-8 border-t border-dashed border-neutral-300"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        sizeVariant="sm"
        icon={Eraser}
        className="self-end"
        disabled={disabled || isEmpty}
        onClick={handleClear}
      >
        Borrar firma
      </Button>
    </div>
  );
}
